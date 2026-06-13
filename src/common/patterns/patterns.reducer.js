import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';
import { createPatternsState } from '../sequencerModel';
import { channelsSlice } from '../channels/channels.reducer';

export const patternsInitialState = createPatternsState({
  laneIds: presets[1].channels.map(channel => channel.id),
});

const addLaneId = (state, laneId) => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (pattern && !pattern.laneIds.includes(laneId)) {
      pattern.laneIds.push(laneId);
    }
  });
};

const removeLaneId = (state, laneId) => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (pattern) {
      pattern.laneIds = pattern.laneIds.filter(id => id !== laneId);
    }
  });
};

const reorderLaneIds = (state, oldIndex, newIndex) => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (!pattern) {
      return;
    }
    const ids = [...pattern.laneIds];
    const [movedId] = ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, movedId);
    pattern.laneIds = ids;
  });
};

export const patternsSlice = createSlice({
  name: 'patterns',
  initialState: patternsInitialState,
  reducers: {
    replacePatternLanes(state, action) {
      state.ids.forEach((patternId) => {
        state.entities[patternId].laneIds = action.payload;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(channelsSlice.actions.addChannel, (state, action) => {
        addLaneId(state, action.payload.laneId || action.payload.id);
      })
      .addCase(channelsSlice.actions.removeChannel, (state, action) => {
        removeLaneId(state, action.payload);
      })
      .addCase(channelsSlice.actions.updateChannelOrder, (state, action) => {
        reorderLaneIds(state, action.payload.oldIndex, action.payload.newIndex);
      })
      .addCase(channelsSlice.actions.replaceChannels, (state, action) => {
        const laneIds = action.payload.channels.map(channel => channel.laneId || channel.id);
        state.ids.forEach((patternId) => {
          state.entities[patternId].laneIds = laneIds;
        });
      });
  },
});

export const {
  replacePatternLanes,
} = patternsSlice.actions;

export const replacePatternChannels = replacePatternLanes;

export const patternsReducer = patternsSlice.reducer;
