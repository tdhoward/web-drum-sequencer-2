/** @jest-environment jsdom */

import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { loadSampleBuffer } from '../../services/sampleStore';
import { classicDarkTheme } from '../../styles/theme';
import {
  SampleEditorModal,
  type SampleEditorChannel,
  type SampleEditorModalProps,
} from './SampleEditorModal.component';

jest.mock('../../services/audioRouter', () => ({
  playNote: jest.fn(),
  stopAllNotes: jest.fn(),
}));

jest.mock('../../services/channelTriggerEvents', () => ({
  notifyChannelTriggered: jest.fn(),
}));

jest.mock('../../services/sampleStore', () => ({
  loadSampleBuffer: jest.fn(),
}));

jest.mock('../../services/sampleEditing', () => ({
  DEFAULT_TRIM_FADE_SECONDS: 0.003,
  cloneAudioBuffer: (buffer: AudioBuffer) => buffer,
  detectAudibleRange: (buffer: AudioBuffer) => ({
    startSample: 0,
    endSample: buffer.length,
  }),
  renderEditedSampleBuffer: (
    buffer: AudioBuffer,
    settings: {
      startSample: number;
      endSample: number;
    },
  ) => {
    const length = settings.endSample - settings.startSample;
    return {
      ...buffer,
      length,
      duration: length / buffer.sampleRate,
    } as AudioBuffer;
  },
}));

jest.mock('../SampleWaveform.component', () => {
  const actual = jest.requireActual('../SampleWaveform.component');
  return {
    ...actual,
    drawWaveform: jest.fn(),
  };
});

jest.mock('../SampleSelect', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  return {
    getSampleDisplayName: (sample?: string) => sample || 'Sample unavailable',
    SamplePicker: ({
      disabled,
      onChooseFile,
      onRecordSample,
    }: {
      disabled?: boolean;
      onChooseFile?: () => void;
      onRecordSample?: () => void;
    }) => ReactModule.createElement(
      'div',
      null,
      ReactModule.createElement('button', {
        disabled,
        onClick: onChooseFile,
        type: 'button',
      }, 'Choose file'),
      ReactModule.createElement('button', {
        disabled,
        onClick: onRecordSample,
        type: 'button',
      }, 'Record sample'),
    ),
  };
});

jest.mock('../SampleRecorderModal', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  return {
    SampleRecorderModal: ({
      onClose,
      onSaveRecordedSample,
      show,
    }: {
      onClose: () => void;
      onSaveRecordedSample: (buffer: AudioBuffer, name: string) => Promise<void>;
      show: boolean;
    }) => show
      ? ReactModule.createElement('button', {
        onClick: () => {
          void onSaveRecordedSample({} as AudioBuffer, 'Recorded Layer').then(onClose);
        },
        type: 'button',
      }, 'Save recording')
      : null,
  };
});

class TestAudioBuffer {
  numberOfChannels = 1;

  length = 1000;

  sampleRate = 1000;

  duration = 1;

  private channelData = new Float32Array(this.length);

  copyFromChannel(destination: Float32Array): void {
    destination.set(this.channelData.subarray(0, destination.length));
  }

  copyToChannel(source: Float32Array): void {
    this.channelData.set(source.subarray(0, this.channelData.length));
  }

  getChannelData(): Float32Array {
    return this.channelData;
  }
}

const audioBuffer = new TestAudioBuffer() as unknown as AudioBuffer;
const mockedLoadSampleBuffer = (
  loadSampleBuffer as jest.MockedFunction<typeof loadSampleBuffer>
);

const singleLayerChannel: SampleEditorChannel = {
  id: 'snare',
  name: 'Snare',
  referenceVelocityLayerId: 'main',
  velocityLayers: [{
    id: 'main',
    sampleId: 'sample:user-snare.wav',
    sample: 'user-snare.wav',
    sampleLoaded: true,
    maxVelocity: 127,
    alignmentOffset: 0.4,
    trimDb: 0,
  }],
};

const createProps = (
  overrides: Partial<SampleEditorModalProps> = {},
): SampleEditorModalProps => ({
  channel: singleLayerChannel,
  onApplyVelocityLayers: jest.fn(() => Promise.resolve()),
  onClose: jest.fn(),
  onCreateRecordedSample: jest.fn(() => Promise.resolve('recorded.wav')),
  onCreateUploadedSample: jest.fn(() => Promise.resolve('uploaded.wav')),
  onSaveEditedSample: jest.fn(() => Promise.resolve('snare-copy.wav')),
  userSamples: [],
  ...overrides,
});

const renderEditor = (props: SampleEditorModalProps) => render(
  <ThemeProvider theme={classicDarkTheme}>
    <SampleEditorModal {...props} />
  </ThemeProvider>,
);

const getReadyCanvas = async (name: RegExp): Promise<HTMLCanvasElement> => {
  const canvas = await screen.findByLabelText(name) as HTMLCanvasElement;
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
  Object.defineProperty(canvas, 'setPointerCapture', {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(canvas, 'hasPointerCapture', {
    configurable: true,
    value: jest.fn(() => false),
  });
  await waitFor(() => {
    expect((screen.getByRole('button', { name: 'Auto Select' }) as HTMLButtonElement).disabled)
      .toBe(false);
  });
  return canvas;
};

describe('SampleEditorModal Phase 6 workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'PointerEvent', {
      configurable: true,
      value: MouseEvent,
    });
    mockedLoadSampleBuffer.mockResolvedValue(audioBuffer);
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: '',
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('switches gesture behavior between Audio Edit and Beat Alignment', async () => {
    const props = createProps();
    renderEditor(props);
    const audioCanvas = await getReadyCanvas(/Edit Main 1-127 sample waveform/);

    expect(screen.getByRole('button', { name: 'Audio Edit' }).getAttribute('aria-pressed'))
      .toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Beat Alignment' }));
    const alignmentCanvas = screen.getByLabelText(
      /Set Main 1-127 sample beat alignment/,
    ) as HTMLCanvasElement;
    Object.defineProperty(alignmentCanvas, 'getBoundingClientRect', {
      configurable: true,
      value: audioCanvas.getBoundingClientRect.bind(audioCanvas),
    });

    expect(screen.queryByRole('button', { name: 'Trim to Selection' })).toBeNull();
    fireEvent.pointerDown(alignmentCanvas, { clientX: 50, pointerId: 1 });
    expect(screen.getByRole('button', { name: 'Apply' })).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(props.onApplyVelocityLayers).toHaveBeenCalled());

    const [layers] = (props.onApplyVelocityLayers as jest.Mock).mock.calls[0];
    expect(layers[0].alignmentOffset).toBe(0.5);
    expect(props.onSaveEditedSample).not.toHaveBeenCalled();
  });

  test('saves a copy and applies the complete draft in one action', async () => {
    const props = createProps();
    renderEditor(props);
    const canvas = await getReadyCanvas(/Edit Main 1-127 sample waveform/);

    fireEvent.pointerDown(canvas, { clientX: 25, pointerId: 1 });
    const primaryAction = await screen.findByRole('button', {
      name: 'Save Copy & Apply',
    });
    fireEvent.click(primaryAction);

    await waitFor(() => expect(props.onApplyVelocityLayers).toHaveBeenCalled());
    expect(props.onSaveEditedSample).toHaveBeenCalledWith(
      expect.anything(),
      'user-snare.wav',
      'user-snare.wav Edit',
      undefined,
      {
        trimStartSeconds: 0.25,
        renderedDuration: 0.75,
      },
    );
    const [layers] = (props.onApplyVelocityLayers as jest.Mock).mock.calls[0];
    expect(layers[0].sampleId).toBe('sample:snare-copy.wav');
    expect(layers[0].alignmentOffset).toBeCloseTo(0.15);
    expect(props.onClose).toHaveBeenCalled();
  });

  test('uses Replace & Apply for an explicitly selected user-sample replacement', async () => {
    const props = createProps({
      onSaveEditedSample: jest.fn(() => Promise.resolve('user-snare.wav')),
      userSamples: [{ id: 'user-snare.wav', name: 'Shared Snare' }],
    });
    renderEditor(props);
    const canvas = await getReadyCanvas(/Edit Main 1-127 sample waveform/);

    fireEvent.pointerDown(canvas, { clientX: 25, pointerId: 1 });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Replace & Apply' }));

    await waitFor(() => expect(props.onApplyVelocityLayers).toHaveBeenCalled());
    expect(props.onSaveEditedSample).toHaveBeenCalledWith(
      expect.anything(),
      'user-snare.wav',
      'Shared Snare',
      'user-snare.wav',
      {
        trimStartSeconds: 0.25,
        renderedDuration: 0.75,
      },
    );
  });

  test('does not commit the channel draft when sample persistence fails', async () => {
    const props = createProps({
      onSaveEditedSample: jest.fn(() => Promise.reject(new Error('save failed'))),
    });
    renderEditor(props);
    const canvas = await getReadyCanvas(/Edit Main 1-127 sample waveform/);

    fireEvent.pointerDown(canvas, { clientX: 25, pointerId: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Save Copy & Apply' }));

    await screen.findByText('Could not save sample');
    expect(props.onApplyVelocityLayers).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  test('creates uploaded assets in the local draft and Cancel discards the assignment', async () => {
    const props = createProps();
    const { container } = renderEditor(props);
    await getReadyCanvas(/Edit Main 1-127 sample waveform/);

    fireEvent.click(screen.getByRole('button', { name: 'Choose file' }));
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['sample'], 'uploaded.wav', { type: 'audio/wav' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(props.onCreateUploadedSample).toHaveBeenCalledWith(file));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onApplyVelocityLayers).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  test('creates a recorded asset without assigning it before Apply', async () => {
    const props = createProps();
    renderEditor(props);
    await getReadyCanvas(/Edit Main 1-127 sample waveform/);

    fireEvent.click(screen.getByRole('button', { name: 'Record sample' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save recording' }));
    await waitFor(() => expect(props.onCreateRecordedSample).toHaveBeenCalledWith(
      expect.anything(),
      'Recorded Layer',
    ));
    expect(props.onApplyVelocityLayers).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(props.onApplyVelocityLayers).toHaveBeenCalled());
    const [layers] = (props.onApplyVelocityLayers as jest.Mock).mock.calls[0];
    expect(layers[0].sampleId).toBe('sample:recorded.wav');
  });

  test('requires confirmation before dirty waveform edits are discarded on layer switch', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const props = createProps({
      channel: {
        ...singleLayerChannel,
        referenceVelocityLayerId: 'soft',
        velocityLayers: [
          {
            ...singleLayerChannel.velocityLayers[0],
            id: 'soft',
            maxVelocity: 64,
          },
          {
            ...singleLayerChannel.velocityLayers[0],
            id: 'hard',
            maxVelocity: 127,
          },
        ],
      },
    });
    renderEditor(props);
    const canvas = await getReadyCanvas(/Edit Soft 1-64 sample waveform/);

    fireEvent.pointerDown(canvas, { clientX: 25, pointerId: 1 });
    const hardLayer = screen.getByRole('button', {
      name: /Hard, velocities 65-127/,
    });
    fireEvent.click(hardLayer);

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText(/Selected: Soft/)).not.toBeNull();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(hardLayer);
    await screen.findByText(/Selected: Hard/);
  });
});
