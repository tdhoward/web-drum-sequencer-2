import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import presets from '../../presets';

type MasterPreset = {
  channels: {
    id: string;
  }[];
};

const typedPresets = presets as MasterPreset[];

export type MasterState = {
  selectedChannel?: string;
};

export const masterInitialState: MasterState = {
  selectedChannel: typedPresets[1].channels[0].id,
};

export const masterSlice = createSlice({
  name: 'master',
  initialState: masterInitialState,
  reducers: {
    setSelectedChannel(state, action: PayloadAction<string | undefined>) {
      state.selectedChannel = action.payload;
    },
  },
});

export const {
  setSelectedChannel,
} = masterSlice.actions;

export const masterReducer = masterSlice.reducer;
