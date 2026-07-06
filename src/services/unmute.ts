import silence from '../assets/silence.mp3';

export const unmute = (): void => {
  const el = document.createElement('audio');
  el.src = silence;
  el.play();
};
