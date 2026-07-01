import { loadSample } from '../../services/sampleStore';
import { initializeChannelNotes, removeChannelNotes } from '../notes';
import { uuid } from '../../services/uuid';
import factorySamples from '../../samples.config';
import { setSelectedChannel } from '../master';
import { selectedKitIdSelector } from '../song';
import { addSampleFromUrl } from '../samples';
import { PERCUSSION_TYPES } from '../percussion';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { channelsSlice } from './channels.reducer';

const NEW_CHANNEL_NAME_PREFIX = 'New channel';

export const getNextNewChannelName = (channels = []) => {
  const usedNumbers = channels.reduce((numbers, channel) => {
    const match = String(channel.name || '').match(/^New channel ([1-9]\d*)$/);
    if (match) {
      numbers.add(Number(match[1]));
    }
    return numbers;
  }, new Set());

  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return `${NEW_CHANNEL_NAME_PREFIX} ${nextNumber}`;
};

export const {
  setChannelGain,
  setChannelName,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelPitchFine,
  setChannelMuted,
  setChannelSolo,
  addChannel,
  removeChannel,
  updateChannelOrder,
  replaceChannels,
  replaceKitChannels,
  sampleLoaded,
  setChannelSample,
  setChannelReverb,
} = channelsSlice.actions;

export const loadSampleStatefully = (dispatch, channel) => {
  dispatch(sampleLoaded(channel.id, false));
  loadSample(channel.sample).then((success) => {
    if (success) {
      dispatch(sampleLoaded(channel.id, true));
    }
  });
};

export const loadChannels = channels => (dispatch, getState) => {
  const kitId = selectedKitIdSelector(getState());
  channels.forEach((channel) => {
    dispatch(addSampleFromUrl(channel.sample, 'factory'));
    loadSampleStatefully(dispatch, channel);
  });
  dispatch(replaceKitChannels(channels, kitId));
};

export const newChannel = () => (dispatch, getState) => {
  const channelId = uuid();
  const state = getState();
  const kitId = selectedKitIdSelector(state);
  const kit = state.kits?.entities?.[kitId];
  const kitChannels = state.kitChannels || state.channels || { entities: {} };
  const existingKitChannels = (kit?.channelIds || kitChannels.ids || [])
    .map(id => kitChannels.entities[id])
    .filter(Boolean);
  const channelToAdd = {
    id: channelId,
    name: getNextNewChannelName(existingKitChannels),
    kitId,
    laneId: channelId,
    percussionType: PERCUSSION_TYPES.GENERIC_PERCUSSION,
    sample: factorySamples[0].url,
    gain: 1,
    pitchCoarse: 0,
    pitchFine: 0,
    pan: 0,
  };
  dispatch(addSampleFromUrl(channelToAdd.sample, 'factory'));
  dispatch(addChannel(channelToAdd));
  dispatch(initializeChannelNotes(channelToAdd.id));
  dispatch(setSelectedChannel(channelToAdd.id));
  loadSampleStatefully(dispatch, channelToAdd);
};

export const loadAndSetChannelSample = (channelID, sampleURL) => (dispatch) => {
  dispatch(sampleLoaded(channelID, false));
  loadSample(sampleURL).then((success) => {
    if (success) {
      dispatch(sampleLoaded(channelID, true));
    } else {
      dispatch(showFlashMessage(FLASH_MESSAGES.SAMPLE_LOAD_ERROR));
    }
  });
  dispatch(addSampleFromUrl(sampleURL, 'user'));
  dispatch(setChannelSample(channelID, sampleURL));
};

const getKitChannelId = channel => channel.kitChannelId || channel.id;

export const deleteChannel = (
  channelID,
  channels,
  selectedChannelId,
  laneId = channelID,
) => (dispatch) => {
  if (channels.length === 1) {
    dispatch(newChannel());
    dispatch(removeChannelNotes(laneId));
    dispatch(removeChannel(channelID));
    return;
  }

  if (selectedChannelId === channelID || selectedChannelId === laneId) {
    const nextChannel = channels.find(channel => getKitChannelId(channel) !== channelID);
    dispatch(setSelectedChannel(nextChannel.id));
  }
  dispatch(removeChannelNotes(laneId));
  dispatch(removeChannel(channelID));
};
