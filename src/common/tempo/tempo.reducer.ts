import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import presets from '../../presets';

type TempoPreset = {
  bpm: number;
  swing: number;
};

const typedPresets = presets as TempoPreset[];

export type TempoState = {
  bpm: number;
  swing: number;
};

export const tempoInitialState: TempoState = {
  bpm: typedPresets[1].bpm,
  swing: typedPresets[1].swing,
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
