type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioCtx: AudioContext | undefined;

export const getAudioContext = (): AudioContext => {
  if (typeof audioCtx === 'undefined') {
    const AudioContextConstructor = window.AudioContext
      || (window as WebkitAudioWindow).webkitAudioContext;
    audioCtx = new AudioContextConstructor();
  }
  return audioCtx;
};

export const getCurrentBeat = (
  bpm: number,
  startTime: number,
  currentTime?: number,
  patternLengthInBeats = 4,
): number => {
  const safeCurrentTime = typeof currentTime === 'undefined'
    ? getAudioContext().currentTime
    : currentTime;

  const beatsPerSecond = bpm / 60;
  const currentBeat = ((safeCurrentTime - startTime) * beatsPerSecond);
  return (currentBeat % patternLengthInBeats) + 1;
};
