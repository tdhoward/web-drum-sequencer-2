import { detuneSupported, stereoPannerSupported } from './featureChecks';
import { getAudioContext } from './audioContext';
import { loadImpulseResponse } from './reverb';
import impulseResponse from '../assets/impulse-responses/ruby-room.mp3';

const audioCtx = getAudioContext();

const masterOut = audioCtx.createGain();
masterOut.connect(audioCtx.destination);

export const analyserNode = audioCtx.createAnalyser();
analyserNode.smoothingTimeConstant = 0;
masterOut.connect(analyserNode);

const reverbNode = audioCtx.createConvolver();
reverbNode.connect(masterOut);
loadImpulseResponse(impulseResponse).then((impulseResponseArrayBuffer) => {
  reverbNode.buffer = impulseResponseArrayBuffer;
});

/**
 * The channel routing is:
 *
 * Drum Sample
 *  -> Gain node
 *    -> Reverb node
 *      -> Master out
 *        -> Destination
 *        -> Analyser
 *    -> Pan node
 *      -> Master out
 *        -> Destination
 *        -> Analyser
 */

const channelGainNodes = {};
const channelPanNodes = {};
const channelReverbNodes = {};
const activeVoices = new Set();
const STOP_FADE_OUT_SECONDS = 0.03;

const calculateGain = (channel, soloEnabled) => {
  if (channel.muted) {
    return 0;
  }
  if (soloEnabled && !channel.solo) {
    return 0;
  }
  if (channel.gain === 'undefined') {
    return 1;
  }
  return channel.gain;
};

const updateGainNode = (channel, soloEnabled) => {
  if (typeof channelGainNodes[channel.id] === 'undefined') {
    channelGainNodes[channel.id] = audioCtx.createGain();
    channelGainNodes[channel.id].connect(channelPanNodes[channel.id]);
    channelGainNodes[channel.id].connect(channelReverbNodes[channel.id]);
  }
  channelGainNodes[channel.id].gain.setValueAtTime(
    calculateGain(channel, soloEnabled),
    audioCtx.currentTime,
  );
};

const updatePanNode = (channel) => {
  if (stereoPannerSupported) {
    if (typeof channelPanNodes[channel.id] === 'undefined') {
      channelPanNodes[channel.id] = audioCtx.createStereoPanner();
      channelPanNodes[channel.id].connect(masterOut);
    }
    channelPanNodes[channel.id].pan.setValueAtTime(
      typeof channel.pan === 'undefined' ? 0 : channel.pan,
      audioCtx.currentTime,
    );
  } else {
    if (typeof channelPanNodes[channel.id] === 'undefined') {
      channelPanNodes[channel.id] = audioCtx.createPanner();
      channelPanNodes[channel.id].panningModel = 'equalpower';
      channelPanNodes[channel.id].connect(masterOut);
    }
    const pan = typeof channel.pan === 'undefined' ? 0 : channel.pan;
    channelPanNodes[channel.id].setPosition(pan, 0, 1 - Math.abs(pan));
  }
};

const updateReverbNode = (channel) => {
  if (typeof channelReverbNodes[channel.id] === 'undefined') {
    channelReverbNodes[channel.id] = audioCtx.createGain();
    channelReverbNodes[channel.id].connect(reverbNode);
  }
  channelReverbNodes[channel.id].gain.setValueAtTime(
    typeof channel.reverb === 'undefined' ? 0 : channel.reverb,
    audioCtx.currentTime,
  );
};

const checkSoloEnabled = (channels) => {
  for (let i = 0; i < channels.length; i += 1) {
    if (channels[i].solo) {
      return true;
    }
  }
  return false;
};

export const updateChannelNodes = (channels) => {
  channels.forEach((channel) => {
    updateReverbNode(channel);
    updatePanNode(channel);
    updateGainNode(channel, checkSoloEnabled(channels));
  });
};

const ensureChannelNodes = (channelID) => {
  if (typeof channelPanNodes[channelID] === 'undefined') {
    if (stereoPannerSupported) {
      channelPanNodes[channelID] = audioCtx.createStereoPanner();
      channelPanNodes[channelID].connect(masterOut);
    } else {
      channelPanNodes[channelID] = audioCtx.createPanner();
      channelPanNodes[channelID].panningModel = 'equalpower';
      channelPanNodes[channelID].connect(masterOut);
    }
  }

  if (typeof channelReverbNodes[channelID] === 'undefined') {
    channelReverbNodes[channelID] = audioCtx.createGain();
    channelReverbNodes[channelID].gain.setValueAtTime(0, audioCtx.currentTime);
    channelReverbNodes[channelID].connect(reverbNode);
  }

  if (typeof channelGainNodes[channelID] === 'undefined') {
    channelGainNodes[channelID] = audioCtx.createGain();
    channelGainNodes[channelID].gain.setValueAtTime(1, audioCtx.currentTime);
    channelGainNodes[channelID].connect(channelPanNodes[channelID]);
    channelGainNodes[channelID].connect(channelReverbNodes[channelID]);
  }
};

export const playNote = (noteTime, buffer, channelID, notePitch = 0) => {
  ensureChannelNodes(channelID);

  const source = audioCtx.createBufferSource();
  const voiceGainNode = audioCtx.createGain();
  source.buffer = buffer;
  voiceGainNode.gain.setValueAtTime(1, audioCtx.currentTime);

  if (detuneSupported) {
    source.detune.value = notePitch;
  }

  const voice = {
    source,
    gainNode: voiceGainNode,
  };

  source.connect(voiceGainNode);
  voiceGainNode.connect(channelGainNodes[channelID]);
  source.onended = () => {
    activeVoices.delete(voice);
  };

  source.start(noteTime);
  activeVoices.add(voice);
  return source;
};

export const stopAllNotes = () => {
  const stopTime = audioCtx.currentTime + STOP_FADE_OUT_SECONDS;

  activeVoices.forEach(({ source, gainNode }) => {
    try {
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, stopTime);
      source.stop(stopTime);
    } catch {
      // The source may have already ended between ticks.
    }
  });
  activeVoices.clear();
};
