import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import patternPacks from '../../patternPacks';

export type PatternPacksState = {
  selectedPatternPackId?: string;
};

export const patternPacksInitialState: PatternPacksState = {
  selectedPatternPackId: patternPacks[1]?.id || patternPacks[0]?.id,
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
