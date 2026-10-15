/** @jest-environment jsdom */

import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { loadSampleBuffer } from '../services/sampleStore';
import { classicDarkTheme } from '../styles/theme';
import {
  getWaveformPeaks,
  getWaveformTracePoints,
  alignmentOffsetFromPointer,
  clampAlignmentOffset,
  formatAlignmentOffset,
  SampleWaveform,
  shouldShowAlignmentIndicator,
} from './SampleWaveform.component';

jest.mock('../services/sampleStore', () => ({
  loadSampleBuffer: jest.fn(),
}));

class TestAudioBuffer {
  numberOfChannels: number;

  length: number;

  sampleRate: number;

  duration: number;

  private channelData: Float32Array[];

  constructor(channels: number[][], sampleRate = 1000) {
    this.numberOfChannels = channels.length;
    this.length = channels[0].length;
    this.sampleRate = sampleRate;
    this.duration = this.length / sampleRate;
    this.channelData = channels.map(samples => Float32Array.from(samples));
  }

  copyFromChannel(destination: Float32Array, channel: number, startInChannel = 0): void {
    destination.set(
      this.channelData[channel].subarray(
        startInChannel,
        startInChannel + destination.length,
      ),
    );
  }
}

const createBuffer = (channels: number[][]): AudioBuffer => (
  new TestAudioBuffer(channels) as unknown as AudioBuffer
);

const mockedLoadSampleBuffer = (
  loadSampleBuffer as jest.MockedFunction<typeof loadSampleBuffer>
);

const renderWaveform = (
  props: React.ComponentProps<typeof SampleWaveform>,
) => render(
  <ThemeProvider theme={classicDarkTheme}>
    <SampleWaveform {...props} />
  </ThemeProvider>,
);

describe('getWaveformPeaks', () => {
  test('keeps single-sample buckets visible when a short sample is wider than its audio frame count', () => {
    const audioBuffer = createBuffer([[0.5, -0.25]]);

    const peaks = getWaveformPeaks(audioBuffer, 4);

    expect(peaks).toEqual([
      { min: 0, max: 0.5 },
      { min: 0, max: 0.5 },
      { min: -0.25, max: 0 },
      { min: -0.25, max: 0 },
    ]);
  });

  test('still draws multi-sample buckets as true min and max peaks', () => {
    const audioBuffer = createBuffer([[0.5, -0.25, 0.125, -0.75]]);

    const peaks = getWaveformPeaks(audioBuffer, 2);

    expect(peaks).toEqual([
      { min: -0.25, max: 0.5 },
      { min: -0.75, max: 0.125 },
    ]);
  });
});

describe('getWaveformTracePoints', () => {
  test('maps every sample to a point across the canvas width', () => {
    const audioBuffer = createBuffer([[0, 0.5, -0.25, 0.75]]);

    const points = getWaveformTracePoints(audioBuffer, 9);

    expect(points.map(point => point.value)).toEqual([0, 0.5, -0.25, 0.75]);
    expect(points[0].x).toBe(0);
    expect(points[1].x).toBeCloseTo(8 / 3);
    expect(points[2].x).toBeCloseTo(16 / 3);
    expect(points[3].x).toBe(8);
  });

  test('averages channels before drawing oscilloscope trace points', () => {
    const audioBuffer = createBuffer([
      [0.5, -0.25],
      [-0.25, 0.75],
    ]);

    const points = getWaveformTracePoints(audioBuffer, 5);

    expect(points).toEqual([
      { value: 0.125, x: 0 },
      { value: 0.25, x: 4 },
    ]);
  });
});

describe('sample beat alignment interaction helpers', () => {
  test('maps touch or pointer positions to seconds and clamps them to the sample', () => {
    expect(alignmentOffsetFromPointer(150, 100, 200, 2)).toBe(0.5);
    expect(alignmentOffsetFromPointer(50, 100, 200, 2)).toBe(0);
    expect(alignmentOffsetFromPointer(350, 100, 200, 2)).toBe(2);
  });

  test('reset and step values remain within sample boundaries', () => {
    expect(clampAlignmentOffset(0, 1.5)).toBe(0);
    expect(clampAlignmentOffset(-0.01, 1.5)).toBe(0);
    expect(clampAlignmentOffset(1.51, 1.5)).toBe(1.5);
  });

  test('formats the editing value in user-friendly milliseconds', () => {
    expect(formatAlignmentOffset(0)).toBe('On sample start');
    expect(formatAlignmentOffset(0.126)).toBe('Start 126 ms early');
  });

  test('treats offsets within the display epsilon as the default position', () => {
    expect(shouldShowAlignmentIndicator(0)).toBe(false);
    expect(shouldShowAlignmentIndicator(0.0005)).toBe(false);
    expect(shouldShowAlignmentIndicator(0.00051)).toBe(true);
  });
});

describe('SampleWaveform Kit-row interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadSampleBuffer.mockResolvedValue(createBuffer([[0, 0.5, -0.25, 0]]));
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
      clearRect: jest.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reports the layer count and opens from pointer, keyboard, and badge-area clicks', async () => {
    const onClick = jest.fn();

    renderWaveform({
      accessibleName: 'Edit Open Hat samples; 3 velocity layers',
      layerCount: 3,
      onClick,
      sampleUrl: 'open-hat.wav',
    });

    const waveformButton = screen.getByRole('button', {
      name: 'Edit Open Hat samples; 3 velocity layers',
    });
    const layerBadge = await screen.findByTestId('velocity-layer-count');

    expect(layerBadge.textContent).toBe('×3');
    expect(window.getComputedStyle(layerBadge).pointerEvents).toBe('none');
    expect(screen.queryByRole('button', { name: 'Align' })).toBeNull();

    fireEvent.pointerDown(waveformButton, { pointerId: 1 });
    fireEvent.click(waveformButton);
    expect(onClick).toHaveBeenCalledTimes(1);

    waveformButton.focus();
    fireEvent.click(waveformButton, { detail: 0 });
    expect(onClick).toHaveBeenCalledTimes(2);

    fireEvent.click(layerBadge);
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  test('shows alignment only when the reference layer has a non-default offset', async () => {
    const { container, rerender } = renderWaveform({
      alignmentOffset: 0,
      sampleUrl: 'snare.wav',
    });

    await screen.findByText('0.00 s');
    expect(container.querySelectorAll('[data-alignment-indicator="true"]')).toHaveLength(0);

    rerender(
      <ThemeProvider theme={classicDarkTheme}>
        <SampleWaveform
          alignmentOffset={0.001}
          sampleUrl="snare.wav"
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('[data-alignment-indicator="true"]')).toHaveLength(2);
    });
  });
});
