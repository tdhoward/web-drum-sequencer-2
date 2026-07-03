type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const AudioContextConstructor = window.AudioContext
  || (window as WebkitAudioWindow).webkitAudioContext;
const audioCtx = new AudioContextConstructor();
const source = audioCtx.createBufferSource();

export const detuneSupported = typeof source.detune !== 'undefined';

export const stereoPannerSupported = typeof audioCtx.createStereoPanner !== 'undefined';
