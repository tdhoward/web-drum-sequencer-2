import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import patternPacks from '../../patternPacks';
import type { PatternPack } from '../sequencerModel';

const typedPatternPacks = patternPacks as PatternPack[];

export type PatternPacksState = {
  selectedPatternPackId?: string;
};

export const patternPacksInitialState: PatternPacksState = {
  selectedPatternPackId: typedPatternPacks[1]?.id || typedPatternPacks[0]?.id,
};

export const patternPacksSlice = createSlice({
  name: 'patternPacks',
  initialState: patternPacksInitialState,
  reducers: {
    setSelectedPatternPack(state, action: PayloadAction<string>) {
      state.selectedPatternPackId = action.payload;
    },
  },
});

export const {
  setSelectedPatternPack,
} = patternPacksSlice.actions;

export const patternPacksReducer = patternPacksSlice.reducer;
