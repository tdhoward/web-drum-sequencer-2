import { createSlice } from '@reduxjs/toolkit';
import * as R from 'ramda';
import presets from '../../presets';

export const channelsInitialState = R.clone(presets[1].channels);

const updateChannel = (state, channelId, update) => {
  const channel = state.find(item => item.id === channelId);
  if (channel) {
    update(channel);
  }
};

export const channelsSlice = createSlice({
  name: 'channels',
  initialState: channelsInitialState,
  reducers: {
    setChannelSample: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.sample = action.payload.sampleURL;
        });
      },
      prepare(channel, sampleURL) {
        return { payload: { channel, sampleURL } };
      },
    },
    setChannelGain: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.gain = action.payload.gain;
        });
      },
      prepare(channel, gain) {
        return { payload: { channel, gain } };
      },
    },
    setChannelPan: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.pan = action.payload.pan;
        });
      },
      prepare(channel, pan) {
        return { payload: { channel, pan } };
      },
    },
    setChannelPitchCoarse: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.pitchCoarse = action.payload.pitchCoarse;
        });
      },
      prepare(channel, pitchCoarse) {
        return { payload: { channel, pitchCoarse } };
      },
    },
    setChannelPitchFine: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.pitchFine = action.payload.pitchFine;
        });
      },
      prepare(channel, pitchFine) {
        return { payload: { channel, pitchFine } };
      },
    },
    setChannelReverb: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.reverb = action.payload.reverb;
        });
      },
      prepare(channel, reverb) {
        return { payload: { channel, reverb } };
      },
    },
    addChannel(state, action) {
      state.push(action.payload);
    },
    removeChannel(state, action) {
      return state.filter(channel => channel.id !== action.payload);
    },
    sampleLoaded: {
      reducer(state, action) {
        updateChannel(state, action.payload.channelID, (channel) => {
          channel.sampleLoaded = action.payload.isLoaded;
        });
      },
      prepare(channelID, isLoaded) {
        return { payload: { channelID, isLoaded } };
      },
    },
    setChannelMuted: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.muted = action.payload.muted;
          channel.solo = false;
        });
      },
      prepare(channel, muted) {
        return { payload: { channel, muted } };
      },
    },
    setChannelSolo: {
      reducer(state, action) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.solo = action.payload.solo;
          channel.muted = false;
        });
      },
      prepare(channel, solo) {
        return { payload: { channel, solo } };
      },
    },
    updateChannelOrder: {
      reducer(state, action) {
        return R.insert(
          action.payload.newIndex,
          state[action.payload.oldIndex],
          R.remove(action.payload.oldIndex, 1, state),
        );
      },
      prepare(oldIndex, newIndex) {
        return { payload: { oldIndex, newIndex } };
      },
    },
    replaceChannels(state, action) {
      return [...action.payload];
    },
  },
});

export const channelsReducer = channelsSlice.reducer;
