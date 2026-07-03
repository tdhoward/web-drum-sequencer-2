import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import presets from '../../presets';

export type TempoState = {
  bpm: number;
  swing: number;
};

export const tempoInitialState: TempoState = {
  bpm: presets[1].bpm,
  swing: presets[1].swing,
};

export const tempoSlice = createSlice({
  name: 'tempo',
  initialState: tempoInitialState,
  reducers: {
    setBPM(state, action: PayloadAction<number>) {
      state.bpm = action.payload;
    },
    setSwing(state, action: PayloadAction<number>) {
      state.swing = action.payload;
    },
  },
});

export const {
  setBPM,
  setSwing,
} = tempoSlice.actions;

export const tempoReducer = tempoSlice.reducer;
