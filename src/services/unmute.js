import silence from '../assets/silence.mp3';

export const unmute = () => {
  const el = document.createElement('audio');
  el.src = silence;
  el.play();
};
