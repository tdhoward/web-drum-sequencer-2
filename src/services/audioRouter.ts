import { detuneSupported, stereoPannerSupported } from './featureChecks';
import { getAudioContext } from './audioContext';
import { loadImpulseResponse } from './reverb';
import impulseResponseUrl from '../assets/impulse-responses/ruby-room.mp3';

type AudioChannel = {
  id: string;
  muted?: boolean;
  solo?: boolean;
  gain?: number;
  pan?: number;
  reverb?: number;
};

type ChannelPanNode = StereoPannerNode | PannerNode;

type ActiveVoice = {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
};

const audioCtx = getAudioContext();

const masterOut = audioCtx.createGain();
masterOut.connect(audioCtx.destination);

export const analyserNode = audioCtx.createAnalyser();
analyserNode.smoothingTimeConstant = 0;
masterOut.connect(analyserNode);

const reverbNode = audioCtx.createConvolver();
reverbNode.connect(masterOut);
loadImpulseResponse(impulseResponseUrl).then((impulseResponseBuffer) => {
  reverbNode.buffer = impulseResponseBuffer;
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

const channelGainNodes: Record<string, GainNode> = {};
const channelPanNodes: Record<string, ChannelPanNode> = {};
const channelReverbNodes: Record<string, GainNode> = {};
const activeVoices = new Set<ActiveVoice>();
const STOP_FADE_OUT_SECONDS = 0.03;

const calculateGain = (channel: AudioChannel, soloEnabled: boolean): number => {
  if (channel.muted) {
    return 0;
  }
  if (soloEnabled && !channel.solo) {
    return 0;
  }
  if (typeof channel.gain === 'undefined') {
    return 1;
  }
  return channel.gain;
};

const updateGainNode = (channel: AudioChannel, soloEnabled: boolean): void => {
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

const ensureStereoPanNode = (channelId: string): StereoPannerNode => {
  if (typeof channelPanNodes[channelId] === 'undefined') {
    channelPanNodes[channelId] = audioCtx.createStereoPanner();
    channelPanNodes[channelId].connect(masterOut);
  }
  return channelPanNodes[channelId] as StereoPannerNode;
};

const ensurePannerNode = (channelId: string): PannerNode => {
  if (typeof channelPanNodes[channelId] === 'undefined') {
    channelPanNodes[channelId] = audioCtx.createPanner();
    channelPanNodes[channelId].panningModel = 'equalpower';
    channelPanNodes[channelId].connect(masterOut);
  }
  return channelPanNodes[channelId] as PannerNode;
};

const updatePanNode = (channel: AudioChannel): void => {
  if (stereoPannerSupported) {
    const panNode = ensureStereoPanNode(channel.id);
    panNode.pan.setValueAtTime(
      typeof channel.pan === 'undefined' ? 0 : channel.pan,
      audioCtx.currentTime,
    );
  } else {
    const panNode = ensurePannerNode(channel.id);
    const pan = typeof channel.pan === 'undefined' ? 0 : channel.pan;
    panNode.setPosition(pan, 0, 1 - Math.abs(pan));
  }
};

const updateReverbNode = (channel: AudioChannel): void => {
  if (typeof channelReverbNodes[channel.id] === 'undefined') {
    channelReverbNodes[channel.id] = audioCtx.createGain();
    channelReverbNodes[channel.id].connect(reverbNode);
  }
  channelReverbNodes[channel.id].gain.setValueAtTime(
    typeof channel.reverb === 'undefined' ? 0 : channel.reverb,
    audioCtx.currentTime,
  );
};

const checkSoloEnabled = (channels: AudioChannel[]): boolean => {
  for (let i = 0; i < channels.length; i += 1) {
    if (channels[i].solo) {
      return true;
    }
  }
  return false;
};

export const updateChannelNodes = (channels: AudioChannel[]): void => {
  const soloEnabled = checkSoloEnabled(channels);
  channels.forEach((channel) => {
    updateReverbNode(channel);
    updatePanNode(channel);
    updateGainNode(channel, soloEnabled);
  });
};

const ensureChannelNodes = (channelId: string): void => {
  if (typeof channelPanNodes[channelId] === 'undefined') {
    if (stereoPannerSupported) {
      ensureStereoPanNode(channelId);
    } else {
      ensurePannerNode(channelId);
    }
  }

  if (typeof channelReverbNodes[channelId] === 'undefined') {
    channelReverbNodes[channelId] = audioCtx.createGain();
    channelReverbNodes[channelId].gain.setValueAtTime(0, audioCtx.currentTime);
    channelReverbNodes[channelId].connect(reverbNode);
  }

  if (typeof channelGainNodes[channelId] === 'undefined') {
    channelGainNodes[channelId] = audioCtx.createGain();
    channelGainNodes[channelId].gain.setValueAtTime(1, audioCtx.currentTime);
    channelGainNodes[channelId].connect(channelPanNodes[channelId]);
    channelGainNodes[channelId].connect(channelReverbNodes[channelId]);
  }
};

export const playNote = (
  noteTime: number | null,
  buffer: AudioBuffer | undefined,
  channelId: string,
  notePitch = 0,
  noteVelocity = 1,
): AudioBufferSourceNode => {
  ensureChannelNodes(channelId);

  const source = audioCtx.createBufferSource();
  const voiceGainNode = audioCtx.createGain();
  source.buffer = buffer ?? null;
  voiceGainNode.gain.setValueAtTime(noteVelocity, audioCtx.currentTime);

  if (detuneSupported) {
    source.detune.value = notePitch;
  }

  const voice = {
    source,
    gainNode: voiceGainNode,
  };

  source.connect(voiceGainNode);
  voiceGainNode.connect(channelGainNodes[channelId]);
  source.onended = () => {
    activeVoices.delete(voice);
  };

  source.start(noteTime ?? undefined);
  activeVoices.add(voice);
  return source;
};

export const getAudioRouterDiagnostics = (channelId: string): Record<string, unknown> => ({
  activeVoices: activeVoices.size,
  channelId,
  channelGain: channelGainNodes[channelId]?.gain.value ?? null,
  channelReverbGain: channelReverbNodes[channelId]?.gain.value ?? null,
  channelPan: stereoPannerSupported
    ? (channelPanNodes[channelId] as StereoPannerNode | undefined)?.pan.value ?? null
    : null,
});

export const stopAllNotes = (): void => {
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
