import { loadSample } from '../../services/sampleStore';
import { setNotes, initializeChannelNotes, removeChannelNotes } from '../notes';
import { uuid } from '../../services/uuid';
import factorySamples from '../../samples.config';
import { setSelectedChannel } from '../master';
import { selectedKitIdSelector } from '../song';
import { addSampleFromUrl } from '../samples';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { channelsSlice } from './channels.reducer';

export const {
  setChannelGain,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelPitchFine,
  setChannelMuted,
  setChannelSolo,
  addChannel,
  removeChannel,
  updateChannelOrder,
  replaceChannels,
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

export const loadChannels = (channels, notes) => (dispatch, getState) => {
  const kitId = selectedKitIdSelector(getState());
  channels.forEach((channel) => {
    dispatch(addSampleFromUrl(channel.sample, 'factory'));
    loadSampleStatefully(dispatch, channel);
  });
  dispatch(replaceChannels(channels, notes, kitId));
  dispatch(setNotes(notes));
};

export const newChannel = () => (dispatch, getState) => {
  const channelId = uuid();
  const kitId = selectedKitIdSelector(getState());
  const channelToAdd = {
    id: channelId,
    kitId,
    laneId: channelId,
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

export const deleteChannel = (channelID, channels, selectedChannelId) => (dispatch) => {
  if (channels.length === 1) {
    dispatch(newChannel());
    dispatch(removeChannelNotes(channelID));
    dispatch(removeChannel(channelID));
    return;
  }

  if (selectedChannelId === channelID) {
    const nextChannel = channels.find(channel => channel.id !== channelID);
    dispatch(setSelectedChannel(nextChannel.id));
  }
  dispatch(removeChannelNotes(channelID));
  dispatch(removeChannel(channelID));
};
