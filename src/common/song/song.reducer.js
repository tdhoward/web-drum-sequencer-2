import { createSlice } from '@reduxjs/toolkit';
import { createSongState, patternIndexToId } from '../sequencerModel';

export const songInitialState = createSongState();

export const songSlice = createSlice({
  name: 'song',
  initialState: songInitialState,
  reducers: {
    setPattern(state, action) {
      state.selectedPatternId = patternIndexToId(action.payload);
    },
    setSelectedPatternId(state, action) {
      state.selectedPatternId = action.payload;
    },
    setSongName(state, action) {
      state.name = action.payload;
    },
    setSelectedKitId(state, action) {
      state.selectedKitId = action.payload;
    },
  },
});

export const {
  setPattern,
  setSelectedPatternId,
  setSongName,
  setSelectedKitId,
} = songSlice.actions;

export const songReducer = songSlice.reducer;
