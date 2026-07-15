import { getAudioContext } from './audioContext';

export type SampleRange = {
  startSample: number;
  endSample: number;
};

export type SampleEditSettings = SampleRange & {
  normalize?: boolean;
  fadeSeconds?: number;
};

const DEFAULT_NORMALIZE_PEAK = 0.95;
export const DEFAULT_TRIM_FADE_SECONDS = 0.003;

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

const getClampedRange = (audioBuffer: AudioBuffer, range: SampleRange): SampleRange => {
  const startSample = clamp(Math.floor(range.startSample), 0, Math.max(0, audioBuffer.length - 1));
  const endSample = clamp(
    Math.ceil(range.endSample),
    startSample + 1,
    audioBuffer.length,
  );

  return { startSample, endSample };
};

export const cloneAudioBuffer = (audioBuffer: AudioBuffer): AudioBuffer => {
  const audioContext = getAudioContext();
  const nextBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate,
  );

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channelSnapshot = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(channelSnapshot, channelIndex);
    nextBuffer.copyToChannel(channelSnapshot, channelIndex);
  }

  return nextBuffer;
};

const applyTrimEndFade = (
  channelData: Float32Array,
  sampleRate: number,
  fadeSeconds = DEFAULT_TRIM_FADE_SECONDS,
): void => {
  const fadeSampleCount = Math.min(
    Math.floor(sampleRate * fadeSeconds),
    channelData.length,
  );

  if (fadeSampleCount < 2) {
    return;
  }

  for (let index = 0; index < fadeSampleCount; index += 1) {
    const fadeOutGain = index / (fadeSampleCount - 1);
    const fadeOutIndex = channelData.length - 1 - index;

    channelData[fadeOutIndex] *= fadeOutGain;
  }
};

export const trimAudioBuffer = (
  audioBuffer: AudioBuffer,
  range: SampleRange,
  fadeSeconds = DEFAULT_TRIM_FADE_SECONDS,
): AudioBuffer => {
  const { startSample, endSample } = getClampedRange(audioBuffer, range);
  const nextLength = endSample - startSample;
  const audioContext = getAudioContext();
  const nextBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    nextLength,
    audioBuffer.sampleRate,
  );

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const sourceData = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(sourceData, channelIndex);
    const nextData = nextBuffer.getChannelData(channelIndex);
    nextData.set(sourceData.subarray(startSample, endSample));
    applyTrimEndFade(nextData, audioBuffer.sampleRate, fadeSeconds);
  }

  return nextBuffer;
};

const getPeakAmplitude = (audioBuffer: AudioBuffer): number => {
  let peak = 0;

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channelData = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(channelData, channelIndex);

    for (let sampleIndex = 0; sampleIndex < channelData.length; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(channelData[sampleIndex]));
    }
  }

  return peak;
};

export const normalizeAudioBuffer = (
  audioBuffer: AudioBuffer,
  targetPeak = DEFAULT_NORMALIZE_PEAK,
): AudioBuffer => {
  const nextBuffer = cloneAudioBuffer(audioBuffer);
  const peak = getPeakAmplitude(nextBuffer);

  if (peak === 0) {
    return nextBuffer;
  }

  const gain = targetPeak / peak;

  for (let channelIndex = 0; channelIndex < nextBuffer.numberOfChannels; channelIndex += 1) {
    const channelData = nextBuffer.getChannelData(channelIndex);

    for (let sampleIndex = 0; sampleIndex < channelData.length; sampleIndex += 1) {
      channelData[sampleIndex] *= gain;
    }
  }

  return nextBuffer;
};

const DETECTION_WINDOW_MS = 2;
const NOISE_EDGE_FRACTION = 0.1;
const NOISE_EDGE_PERCENTILE = 0.25;
// Open well above the measured background, then close more gently to retain
// the decay of a one-shot sound without extending it through steady room noise.
const OPEN_NOISE_RATIO = 10 ** (9 / 20);
const CLOSE_NOISE_RATIO = 10 ** (4 / 20);
const OPEN_PEAK_RATIO = 10 ** (-36 / 20);
const CLOSE_PEAK_RATIO = 10 ** (-46 / 20);

const getPercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const percentileIndex = Math.floor((sortedValues.length - 1) * percentile);

  return sortedValues[percentileIndex];
};

const getBoundaryNoiseFloor = (windowLevels: number[]): number => {
  const edgeWindowCount = Math.max(
    1,
    Math.ceil(windowLevels.length * NOISE_EDGE_FRACTION),
  );
  const leadingNoiseFloor = getPercentile(
    windowLevels.slice(0, edgeWindowCount),
    NOISE_EDGE_PERCENTILE,
  );
  const trailingNoiseFloor = getPercentile(
    windowLevels.slice(-edgeWindowCount),
    NOISE_EDGE_PERCENTILE,
  );

  return Math.min(leadingNoiseFloor, trailingNoiseFloor);
};

const getWindowRmsLevels = (
  channels: Float32Array[],
  windowSampleCount: number,
  audioLength: number,
): number[] => {
  const levels: number[] = [];

  for (let windowStart = 0; windowStart < audioLength; windowStart += windowSampleCount) {
    const windowEnd = Math.min(windowStart + windowSampleCount, audioLength);
    let loudestChannelRms = 0;

    for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
      let sumOfSquares = 0;

      for (let sampleIndex = windowStart; sampleIndex < windowEnd; sampleIndex += 1) {
        const sampleValue = channels[channelIndex][sampleIndex];
        sumOfSquares += sampleValue * sampleValue;
      }

      loudestChannelRms = Math.max(
        loudestChannelRms,
        Math.sqrt(sumOfSquares / (windowEnd - windowStart)),
      );
    }

    levels.push(loudestChannelRms);
  }

  return levels;
};

export const detectAudibleRange = (
  audioBuffer: AudioBuffer,
  thresholdDb = -45,
  paddingMs = 5,
): SampleRange => {
  const minimumOpenThreshold = 10 ** (thresholdDb / 20);
  const paddingSamples = Math.floor((paddingMs / 1000) * audioBuffer.sampleRate);
  const windowSampleCount = Math.max(
    1,
    Math.floor((DETECTION_WINDOW_MS / 1000) * audioBuffer.sampleRate),
  );
  const channels = Array.from({ length: audioBuffer.numberOfChannels }, (_, channelIndex) => {
    const channelData = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(channelData, channelIndex);
    return channelData;
  });
  const windowLevels = getWindowRmsLevels(channels, windowSampleCount, audioBuffer.length);
  const noiseFloor = getBoundaryNoiseFloor(windowLevels);
  const peakLevel = windowLevels.reduce((peak, level) => Math.max(peak, level), 0);
  const openThreshold = Math.max(
    minimumOpenThreshold,
    noiseFloor * OPEN_NOISE_RATIO,
    peakLevel * OPEN_PEAK_RATIO,
  );
  const closeThreshold = Math.max(
    minimumOpenThreshold * 0.5,
    noiseFloor * CLOSE_NOISE_RATIO,
    peakLevel * CLOSE_PEAK_RATIO,
  );
  const firstOpenWindow = windowLevels.findIndex(level => level >= openThreshold);
  let lastOpenWindow = -1;

  for (let windowIndex = windowLevels.length - 1; windowIndex >= 0; windowIndex -= 1) {
    if (windowLevels[windowIndex] >= openThreshold) {
      lastOpenWindow = windowIndex;
      break;
    }
  }

  if (firstOpenWindow === -1 || lastOpenWindow === -1) {
    return {
      startSample: 0,
      endSample: audioBuffer.length,
    };
  }

  let firstAudibleWindow = firstOpenWindow;
  let lastAudibleWindow = lastOpenWindow;

  while (
    firstAudibleWindow > 0
    && windowLevels[firstAudibleWindow - 1] >= closeThreshold
  ) {
    firstAudibleWindow -= 1;
  }

  while (
    lastAudibleWindow < windowLevels.length - 1
    && windowLevels[lastAudibleWindow + 1] >= closeThreshold
  ) {
    lastAudibleWindow += 1;
  }

  const firstAudibleSample = firstAudibleWindow * windowSampleCount;
  const lastAudibleSampleExclusive = Math.min(
    (lastAudibleWindow + 1) * windowSampleCount,
    audioBuffer.length,
  );

  return {
    startSample: clamp(firstAudibleSample - paddingSamples, 0, audioBuffer.length - 1),
    endSample: clamp(lastAudibleSampleExclusive + paddingSamples, 1, audioBuffer.length),
  };
};

export const renderEditedSampleBuffer = (
  audioBuffer: AudioBuffer,
  settings: SampleEditSettings,
): AudioBuffer => {
  const { startSample, endSample } = getClampedRange(audioBuffer, settings);
  const shouldTrim = startSample > 0 || endSample < audioBuffer.length;
  const trimFadeSeconds = settings.fadeSeconds ?? DEFAULT_TRIM_FADE_SECONDS;
  const sourceBuffer = cloneAudioBuffer(audioBuffer);
  const editedBuffer = shouldTrim
    ? trimAudioBuffer(sourceBuffer, { startSample, endSample }, trimFadeSeconds)
    : sourceBuffer;

  return settings.normalize ? normalizeAudioBuffer(editedBuffer) : editedBuffer;
};

const writeString = (view: DataView, offset: number, value: string): void => {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
};

const floatToInt16 = (value: number): number => {
  const clampedValue = clamp(value, -1, 1);
  return clampedValue < 0
    ? clampedValue * 0x8000
    : clampedValue * 0x7fff;
};

export const audioBufferToWavArrayBuffer = (audioBuffer: AudioBuffer): ArrayBuffer => {
  const bytesPerSample = 2;
  const formatChunkSize = 16;
  const headerSize = 44;
  const channelCount = audioBuffer.numberOfChannels;
  const dataSize = audioBuffer.length * channelCount * bytesPerSample;
  const output = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(output);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, formatChunkSize, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: channelCount }, (_, channelIndex) => {
    const channelData = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(channelData, channelIndex);
    return channelData;
  });

  let outputOffset = headerSize;
  for (let sampleIndex = 0; sampleIndex < audioBuffer.length; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      view.setInt16(
        outputOffset,
        floatToInt16(channels[channelIndex][sampleIndex]),
        true,
      );
      outputOffset += bytesPerSample;
    }
  }

  return output;
};
