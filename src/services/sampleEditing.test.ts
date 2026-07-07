import {
  audioBufferToWavArrayBuffer,
  cloneAudioBuffer,
  detectAudibleRange,
  normalizeAudioBuffer,
  renderEditedSampleBuffer,
  trimAudioBuffer,
} from './sampleEditing';

class TestAudioBuffer {
  numberOfChannels: number;

  length: number;

  sampleRate: number;

  duration: number;

  private channelData: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channelData = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    );
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel];
  }

  copyToChannel(source: Float32Array, channel: number, startInChannel = 0): void {
    this.channelData[channel].set(source, startInChannel);
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

class MutatingGetChannelDataAudioBuffer extends TestAudioBuffer {
  getChannelData(channel: number): Float32Array {
    const channelData = super.getChannelData(channel);

    for (let index = 0; index < channelData.length; index += 1) {
      channelData[index] *= 0.5;
    }

    return channelData;
  }
}

type MockAudioContext = {
  createBuffer: jest.Mock<AudioBuffer, [number, number, number]>;
};

let mockAudioContext: MockAudioContext;

jest.mock('./audioContext', () => ({
  getAudioContext: () => mockAudioContext,
}));

const createBuffer = (channels: number[][], sampleRate = 1000): AudioBuffer => {
  const buffer = new TestAudioBuffer(channels.length, channels[0].length, sampleRate);
  channels.forEach((samples, channelIndex) => {
    buffer.getChannelData(channelIndex).set(samples);
  });
  return buffer as unknown as AudioBuffer;
};

const createMutatingGetChannelDataBuffer = (
  channels: number[][],
  sampleRate = 1000,
): AudioBuffer => {
  const buffer = new MutatingGetChannelDataAudioBuffer(
    channels.length,
    channels[0].length,
    sampleRate,
  );

  channels.forEach((samples, channelIndex) => {
    buffer.copyToChannel(Float32Array.from(samples), channelIndex);
  });

  return buffer as unknown as AudioBuffer;
};

const getSamples = (audioBuffer: AudioBuffer, channel = 0): number[] => (
  Array.from(audioBuffer.getChannelData(channel))
);

const copySamples = (audioBuffer: AudioBuffer, channel = 0): number[] => {
  const samples = new Float32Array(audioBuffer.length);
  audioBuffer.copyFromChannel(samples, channel);
  return Array.from(samples);
};

beforeEach(() => {
  mockAudioContext = {
    createBuffer: jest.fn((numberOfChannels, length, sampleRate) => (
      new TestAudioBuffer(numberOfChannels, length, sampleRate) as unknown as AudioBuffer
    )),
  };
});

describe('sample editing helpers', () => {
  test('trims a sample range, preserves the attack, and fades the end', () => {
    const audioBuffer = createBuffer([[0, 1, 1, 1, 1, 0]]);

    const trimmedBuffer = trimAudioBuffer(
      audioBuffer,
      { startSample: 1, endSample: 5 },
      0.002,
    );

    expect(trimmedBuffer.length).toBe(4);
    expect(getSamples(trimmedBuffer)).toEqual([1, 1, 1, 0]);
  });

  test('trimming does not mutate the source buffer', () => {
    const audioBuffer = createBuffer([[0, 1, 1, 1, 1, 0]]);

    trimAudioBuffer(
      audioBuffer,
      { startSample: 1, endSample: 5 },
      0.002,
    );

    expect(getSamples(audioBuffer)).toEqual([0, 1, 1, 1, 1, 0]);
  });

  test('repeated cloning does not mutate the source buffer', () => {
    const audioBuffer = createBuffer([[0, 0.25, -0.5, 0.75, 0]]);

    for (let cloneCount = 0; cloneCount < 5; cloneCount += 1) {
      const clonedBuffer = cloneAudioBuffer(audioBuffer);
      expect(getSamples(clonedBuffer)[3]).toBeCloseTo(0.75);
    }

    expect(getSamples(audioBuffer)).toEqual([0, 0.25, -0.5, 0.75, 0]);
  });

  test('normalizes peak amplitude', () => {
    const audioBuffer = createBuffer([[0.25, -0.5]]);

    const normalizedBuffer = normalizeAudioBuffer(audioBuffer);

    expect(getSamples(normalizedBuffer)[0]).toBeCloseTo(0.475);
    expect(getSamples(normalizedBuffer)[1]).toBeCloseTo(-0.95);
  });

  test('detects audible range with padding', () => {
    const audioBuffer = createBuffer([[0, 0, 0.1, 0.2, 0, 0]]);

    expect(detectAudibleRange(audioBuffer, -30, 1)).toEqual({
      startSample: 1,
      endSample: 5,
    });
  });

  test('renders full-selection edits without boundary fades', () => {
    const audioBuffer = createBuffer([[1, 1, 1]]);

    const editedBuffer = renderEditedSampleBuffer(audioBuffer, {
      startSample: 0,
      endSample: audioBuffer.length,
    });

    expect(getSamples(editedBuffer)).toEqual([1, 1, 1]);
  });

  test('rendering an edited sample does not mutate the source buffer', () => {
    const audioBuffer = createBuffer([[0, 0.5, 0.5, 0.5, 0.5, 0]]);

    const editedBuffer = renderEditedSampleBuffer(audioBuffer, {
      startSample: 1,
      endSample: 5,
      normalize: true,
      fadeSeconds: 0.002,
    });

    expect(getSamples(audioBuffer)).toEqual([0, 0.5, 0.5, 0.5, 0.5, 0]);
    expect(getSamples(editedBuffer)[0]).toBeCloseTo(0.95);
    expect(getSamples(editedBuffer)[1]).toBeCloseTo(0.95);
    expect(getSamples(editedBuffer)[2]).toBeCloseTo(0.95);
    expect(getSamples(editedBuffer)[3]).toBeCloseTo(0);
  });

  test('repeated edit renders from the same source do not compound gain changes', () => {
    const audioBuffer = createBuffer([[0, 0.5, 0.5, 0.5, 0.5, 0]]);

    for (let renderCount = 0; renderCount < 5; renderCount += 1) {
      const editedBuffer = renderEditedSampleBuffer(audioBuffer, {
        startSample: 1,
        endSample: 5,
        normalize: true,
        fadeSeconds: 0.002,
      });

      expect(getSamples(editedBuffer)[1]).toBeCloseTo(0.95);
      expect(getSamples(editedBuffer)[2]).toBeCloseTo(0.95);
    }

    expect(getSamples(audioBuffer)).toEqual([0, 0.5, 0.5, 0.5, 0.5, 0]);
  });

  test('detecting an audible range does not mutate the source buffer', () => {
    const audioBuffer = createBuffer([[0, 0, 0.1, 0.2, 0, 0]]);

    detectAudibleRange(audioBuffer, -30, 1);

    expect(getSamples(audioBuffer)[0]).toBeCloseTo(0);
    expect(getSamples(audioBuffer)[1]).toBeCloseTo(0);
    expect(getSamples(audioBuffer)[2]).toBeCloseTo(0.1);
    expect(getSamples(audioBuffer)[3]).toBeCloseTo(0.2);
    expect(getSamples(audioBuffer)[4]).toBeCloseTo(0);
    expect(getSamples(audioBuffer)[5]).toBeCloseTo(0);
  });

  test('encodes interleaved PCM WAV data', () => {
    const audioBuffer = createBuffer([
      [1, -1],
      [0, 0.5],
    ], 44100);

    const wavArrayBuffer = audioBufferToWavArrayBuffer(audioBuffer);
    const view = new DataView(wavArrayBuffer);

    expect(wavArrayBuffer.byteLength).toBe(52);
    expect(String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
    )).toBe('RIFF');
    expect(String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11),
    )).toBe('WAVE');
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(0);
    expect(view.getInt16(48, true)).toBe(-32768);
    expect(view.getInt16(50, true)).toBe(16383);
  });

  test('encoding a WAV snapshots channel data without mutating the source buffer', () => {
    const audioBuffer = createMutatingGetChannelDataBuffer([
      [1, -1],
      [0, 0.5],
    ], 44100);

    const wavArrayBuffer = audioBufferToWavArrayBuffer(audioBuffer);
    const view = new DataView(wavArrayBuffer);

    expect(copySamples(audioBuffer, 0)).toEqual([1, -1]);
    expect(copySamples(audioBuffer, 1)).toEqual([0, 0.5]);
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(0);
    expect(view.getInt16(48, true)).toBe(-32768);
    expect(view.getInt16(50, true)).toBe(16383);
  });
});
