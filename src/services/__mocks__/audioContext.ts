export const getAudioContext = (): Pick<AudioContext, 'currentTime'> => ({
  currentTime: 1,
});

export const playNote = (): AudioBufferSourceNode => ({} as AudioBufferSourceNode);
