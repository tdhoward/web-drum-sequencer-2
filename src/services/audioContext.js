let audioCtx;

export const getAudioContext = () => {
  if (typeof audioCtx === 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

export const getCurrentBeat = (bpm, startTime, currentTime, patternLengthInBeats = 4) => {
  const safeCurrentTime = typeof currentTime === 'undefined'
    ? audioCtx.currentTime
    : currentTime;

  const beatsPerSecond = bpm / 60;
  const currentBeat = ((safeCurrentTime - startTime) * beatsPerSecond);
  return (currentBeat % patternLengthInBeats) + 1;
};
