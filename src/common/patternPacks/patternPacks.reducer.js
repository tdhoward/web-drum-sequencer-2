import { createSlice } from '@reduxjs/toolkit';
import patternPacks from '../../patternPacks';

export const patternPacksInitialState = {
  selectedPatternPackId: patternPacks[1]?.id || patternPacks[0]?.id,
};

export const patternPacksSlice = createSlice({
  name: 'patternPacks',
  initialState: patternPacksInitialState,
  reducers: {
    setSelectedPatternPack(state, action) {
      state.selectedPatternPackId = action.payload;
    },
  },
});

export const {
  setSelectedPatternPack,
} = patternPacksSlice.actions;

export const patternPacksReducer = patternPacksSlice.reducer;
