import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import defaultPresets from '../../presets';

export type UserPreset = {
  name: string;
  [key: string]: unknown;
};

export type PresetsState = {
  userPresets: UserPreset[];
  preset: string;
};

export const presetsInitialState: PresetsState = {
  userPresets: [],
  preset: defaultPresets[1].name,
};

export const presetsSlice = createSlice({
  name: 'presets',
  initialState: presetsInitialState,
  reducers: {
    setPreset(state, action: PayloadAction<string>) {
      state.preset = action.payload;
    },
    savePreset(state, action: PayloadAction<UserPreset>) {
      state.userPresets = state.userPresets.map(
        userPreset => (userPreset.name === action.payload.name
          ? action.payload
          : userPreset),
      );
    },
    savePresetAs(state, action: PayloadAction<UserPreset>) {
      state.userPresets = [
        ...state.userPresets.filter(
          userPreset => userPreset.name !== action.payload.name,
        ),
        action.payload,
      ];
    },
    deletePreset(state, action: PayloadAction<string>) {
      state.userPresets = state.userPresets.filter(
        userPreset => userPreset.name !== action.payload,
      );
    },
  },
});

export const presetsReducer = presetsSlice.reducer;
