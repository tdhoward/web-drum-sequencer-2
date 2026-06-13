import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';
import { normalizeChannelsState } from '../sequencerModel';
import { notesSlice } from '../notes/notes.reducer';

export const channelsInitialState = normalizeChannelsState(
  presets[1].channels,
  presets[1].notes,
);

const getChannel = (state, channelId) => state.entities[channelId];

const updateChannel = (state, channelId, update) => {
  const channel = getChannel(state, channelId);
  if (channel) {
    update(channel);
  }
};

const moveId = (ids, oldIndex, newIndex) => {
  const nextIds = [...ids];
  const [movedId] = nextIds.splice(oldIndex, 1);
  nextIds.splice(newIndex, 0, movedId);
  return nextIds;
};

const removeNoteId = (channel, noteId) => {
  channel.noteIds = channel.noteIds.filter(id => id !== noteId);
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
      const channel = {
        ...action.payload,
        noteIds: action.payload.noteIds || [],
      };
      state.ids.push(channel.id);
      state.entities[channel.id] = channel;
    },
    removeChannel(state, action) {
      state.ids = state.ids.filter(id => id !== action.payload);
      delete state.entities[action.payload];
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
        state.ids = moveId(
          state.ids,
          action.payload.oldIndex,
          action.payload.newIndex,
        );
      },
      prepare(oldIndex, newIndex) {
        return { payload: { oldIndex, newIndex } };
      },
    },
    replaceChannels: {
      reducer(state, action) {
        return normalizeChannelsState(action.payload.channels, action.payload.notes);
      },
      prepare(channels, notes = {}) {
        return { payload: { channels, notes } };
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(notesSlice.actions.addNote, (state, action) => {
        const channel = getChannel(state, action.payload.channelId);
        if (channel && !channel.noteIds.includes(action.payload.id)) {
          channel.noteIds.push(action.payload.id);
        }
      })
      .addCase(notesSlice.actions.removeNote, (state, action) => {
        const channel = getChannel(state, action.payload.channelId);
        if (channel) {
          removeNoteId(channel, action.payload.id);
        }
      });
  },
});

export const channelsReducer = channelsSlice.reducer;
