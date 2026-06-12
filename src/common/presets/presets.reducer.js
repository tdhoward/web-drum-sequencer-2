import { createSlice } from '@reduxjs/toolkit';
import defaultPresets from '../../presets';

export const presetsInitialState = {
  userPresets: [],
  preset: defaultPresets[1].name,
};

export const presetsSlice = createSlice({
  name: 'presets',
  initialState: presetsInitialState,
  reducers: {
    setPreset(state, action) {
      state.preset = action.payload;
    },
    savePreset(state, action) {
      state.userPresets = state.userPresets.map(
        userPreset => (userPreset.name === action.payload.name
          ? action.payload
          : userPreset),
      );
    },
    savePresetAs(state, action) {
      state.userPresets = [
        ...state.userPresets.filter(
          userPreset => userPreset.name !== action.payload.name,
        ),
        action.payload,
      ];
    },
    deletePreset(state, action) {
      state.userPresets = state.userPresets.filter(
        userPreset => userPreset.name !== action.payload,
      );
    },
  },
});

export const presetsReducer = presetsSlice.reducer;
