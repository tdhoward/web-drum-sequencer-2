import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';
import { createPatternsState } from '../sequencerModel';
import { channelsSlice } from '../channels/channels.reducer';

export const patternsInitialState = createPatternsState({
  channelIds: presets[1].channels.map(channel => channel.id),
});

const addChannelId = (state, channelId) => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (pattern && !pattern.channelIds.includes(channelId)) {
      pattern.channelIds.push(channelId);
    }
  });
};

const removeChannelId = (state, channelId) => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (pattern) {
      pattern.channelIds = pattern.channelIds.filter(id => id !== channelId);
    }
  });
};

const reorderChannelIds = (state, oldIndex, newIndex) => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (!pattern) {
      return;
    }
    const ids = [...pattern.channelIds];
    const [movedId] = ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, movedId);
    pattern.channelIds = ids;
  });
};

export const patternsSlice = createSlice({
  name: 'patterns',
  initialState: patternsInitialState,
  reducers: {
    replacePatternChannels(state, action) {
      state.ids.forEach((patternId) => {
        state.entities[patternId].channelIds = action.payload;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(channelsSlice.actions.addChannel, (state, action) => {
        addChannelId(state, action.payload.id);
      })
      .addCase(channelsSlice.actions.removeChannel, (state, action) => {
        removeChannelId(state, action.payload);
      })
      .addCase(channelsSlice.actions.updateChannelOrder, (state, action) => {
        reorderChannelIds(state, action.payload.oldIndex, action.payload.newIndex);
      })
      .addCase(channelsSlice.actions.replaceChannels, (state, action) => {
        const channelIds = action.payload.channels.map(channel => channel.id);
        state.ids.forEach((patternId) => {
          state.entities[patternId].channelIds = channelIds;
        });
      });
  },
});

export const {
  replacePatternChannels,
} = patternsSlice.actions;

export const patternsReducer = patternsSlice.reducer;
