import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';

export const masterInitialState = {
  pattern: 0,
  selectedChannel: presets[1].channels[0].id,
};

export const masterSlice = createSlice({
  name: 'master',
  initialState: masterInitialState,
  reducers: {
    setPattern(state, action) {
      state.pattern = action.payload;
    },
    setSelectedChannel(state, action) {
      state.selectedChannel = action.payload;
    },
  },
});

export const {
  setPattern,
  setSelectedChannel,
} = masterSlice.actions;

export const masterReducer = masterSlice.reducer;
