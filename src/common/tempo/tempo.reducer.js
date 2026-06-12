import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';

export const tempoInitialState = {
  bpm: presets[1].bpm,
  swing: presets[1].swing,
};

export const tempoSlice = createSlice({
  name: 'tempo',
  initialState: tempoInitialState,
  reducers: {
    setBPM(state, action) {
      state.bpm = action.payload;
    },
    setSwing(state, action) {
      state.swing = action.payload;
    },
  },
});

export const {
  setBPM,
  setSwing,
} = tempoSlice.actions;

export const tempoReducer = tempoSlice.reducer;
