type AudioBufferSummary = {
  id: string;
  label: string;
  present: boolean;
  numberOfChannels?: number;
  length?: number;
  sampleRate?: number;
  duration?: number;
  peak?: number;
  rms?: number;
  meanAbs?: number;
  firstAudibleSample?: number;
  lastAudibleSample?: number;
  sparseHash?: number;
  probeSamples?: number[];
};

const bufferIds = new WeakMap<AudioBuffer, number>();
let nextBufferId = 1;

const round = (value: number, digits = 6): number => (
  Number.isFinite(value) ? Number(value.toFixed(digits)) : value
);

export const getAudioBufferDebugId = (audioBuffer: AudioBuffer): string => {
  const existingId = bufferIds.get(audioBuffer);

  if (existingId) {
    return `buffer-${existingId}`;
  }

  const id = nextBufferId;
  nextBufferId += 1;
  bufferIds.set(audioBuffer, id);
  return `buffer-${id}`;
};

const getProbeSamples = (audioBuffer: AudioBuffer): number[] => {
  if (audioBuffer.length === 0 || audioBuffer.numberOfChannels === 0) {
    return [];
  }

  const channelData = new Float32Array(audioBuffer.length);
  audioBuffer.copyFromChannel(channelData, 0);
  const sampleIndexes = [
    0,
    Math.floor(audioBuffer.length * 0.25),
    Math.floor(audioBuffer.length * 0.5),
    Math.floor(audioBuffer.length * 0.75),
    audioBuffer.length - 1,
  ];

  return sampleIndexes.map(sampleIndex => round(channelData[sampleIndex] || 0));
};

export const summarizeAudioBuffer = (
  label: string,
  audioBuffer: AudioBuffer | null | undefined,
): AudioBufferSummary => {
  if (!audioBuffer) {
    return {
      id: 'none',
      label,
      present: false,
    };
  }

  let peak = 0;
  let sumSquares = 0;
  let sumAbs = 0;
  let sampleCount = 0;
  let firstAudibleSample = -1;
  let lastAudibleSample = -1;
  let sparseHash = 0;
  const sparseStep = Math.max(1, Math.floor(audioBuffer.length / 4096));

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channelData = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(channelData, channelIndex);

    for (let sampleIndex = 0; sampleIndex < channelData.length; sampleIndex += 1) {
      const sampleValue = channelData[sampleIndex];
      const absValue = Math.abs(sampleValue);

      peak = Math.max(peak, absValue);
      sumSquares += sampleValue * sampleValue;
      sumAbs += absValue;
      sampleCount += 1;

      if (absValue > 0.000001) {
        if (firstAudibleSample === -1) {
          firstAudibleSample = sampleIndex;
        }
        lastAudibleSample = sampleIndex;
      }

      if (sampleIndex % sparseStep === 0) {
        sparseHash += Math.round(sampleValue * 1000000)
          * (channelIndex + 1)
          * ((sampleIndex % 1021) + 1);
      }
    }
  }

  return {
    id: getAudioBufferDebugId(audioBuffer),
    label,
    present: true,
    numberOfChannels: audioBuffer.numberOfChannels,
    length: audioBuffer.length,
    sampleRate: audioBuffer.sampleRate,
    duration: round(audioBuffer.duration),
    peak: round(peak),
    rms: round(Math.sqrt(sumSquares / Math.max(1, sampleCount))),
    meanAbs: round(sumAbs / Math.max(1, sampleCount)),
    firstAudibleSample,
    lastAudibleSample,
    sparseHash: round(sparseHash, 0),
    probeSamples: getProbeSamples(audioBuffer),
  };
};
