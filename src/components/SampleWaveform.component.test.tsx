import {
  getWaveformPeaks,
  getWaveformTracePoints,
} from './SampleWaveform.component';

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
