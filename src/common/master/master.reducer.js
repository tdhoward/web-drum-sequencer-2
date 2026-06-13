import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';

export const masterInitialState = {
  selectedChannel: presets[1].channels[0].id,
};

export const masterSlice = createSlice({
  name: 'master',
  initialState: masterInitialState,
  reducers: {
    setSelectedChannel(state, action) {
      state.selectedChannel = action.payload;
    },
  },
});

export const {
  setSelectedChannel,
} = masterSlice.actions;

export const masterReducer = masterSlice.reducer;
