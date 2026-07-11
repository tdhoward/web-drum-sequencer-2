import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import { createDefaultPatternsState } from '../defaultSequencerState';
import {
  normalizePatternSettings,
  type PatternSettings,
  type PatternsState,
  type TimeSignature,
} from '../sequencerModel';
import { channelsSlice } from '../channels/channels.reducer';

export const patternsInitialState = createDefaultPatternsState();

const addLaneId = (state: Draft<PatternsState>, laneId: string): void => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (pattern && !pattern.laneIds.includes(laneId)) {
      pattern.laneIds.push(laneId);
    }
  });
};

const removeLaneId = (state: Draft<PatternsState>, laneId: string): void => {
  state.ids.forEach((patternId) => {
    const pattern = state.entities[patternId];
    if (pattern) {
      pattern.laneIds = pattern.laneIds.filter(id => id !== laneId);
    }
  });
};

const reorderLaneIds = (
  state: Draft<PatternsState>,
  oldIndex: number,
  newIndex: number,
): void => {
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

type SetPatternTimeSignaturePayload = {
  patternId: string;
  timeSignature: TimeSignature;
  stepsPerBeat: number;
};

export const patternsSlice = createSlice({
  name: 'patterns',
  initialState: patternsInitialState,
  reducers: {
    replacePatternLanes(state, action: PayloadAction<string[]>) {
      state.ids.forEach((patternId) => {
        state.entities[patternId].laneIds = action.payload;
      });
    },
    replacePatternNames(state, action: PayloadAction<string[]>) {
      state.ids.forEach((patternId, index) => {
        state.entities[patternId].name = action.payload[index] || `Pattern ${index + 1}`;
      });
    },
    replacePatternSettings(state, action: PayloadAction<PatternSettings[]>) {
      state.ids.forEach((patternId, index) => {
        const pattern = state.entities[patternId];

        if (!pattern) {
          return;
        }

        Object.assign(pattern, normalizePatternSettings(action.payload[index]));
      });
    },
    setPatternName(state, action: PayloadAction<{ patternId: string; name: string }>) {
      const pattern = state.entities[action.payload.patternId];

      if (pattern) {
        pattern.name = action.payload.name;
      }
    },
    setPatternTimeSignature(state, action: PayloadAction<SetPatternTimeSignaturePayload>) {
      const pattern = state.entities[action.payload.patternId];

      if (pattern) {
        pattern.timeSignature = action.payload.timeSignature;
        pattern.stepsPerBeat = action.payload.stepsPerBeat;
      }
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
  replacePatternNames,
  replacePatternSettings,
  setPatternName,
  setPatternTimeSignature,
} = patternsSlice.actions;

export const replacePatternChannels = replacePatternLanes;

export const patternsReducer = patternsSlice.reducer;
