import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { patternIndexToId } from '../sequencerModel';
import { createDefaultSongState } from '../defaultSequencerState';

export const songInitialState = createDefaultSongState();

export const songSlice = createSlice({
  name: 'song',
  initialState: songInitialState,
  reducers: {
    setPattern(state, action: PayloadAction<number>) {
      state.selectedPatternId = patternIndexToId(action.payload);
    },
    setSelectedPatternId(state, action: PayloadAction<string>) {
      state.selectedPatternId = action.payload;
    },
    setSongName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setSelectedKitId(state, action: PayloadAction<string>) {
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
