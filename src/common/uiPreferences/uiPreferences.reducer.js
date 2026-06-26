import { createSlice } from '@reduxjs/toolkit';
import { colorThemes, DEFAULT_THEME_ID } from '../../styles/theme';

export const uiPreferencesInitialState = {
  selectedThemeId: DEFAULT_THEME_ID,
};

export const uiPreferencesSlice = createSlice({
  name: 'uiPreferences',
  initialState: uiPreferencesInitialState,
  reducers: {
    setSelectedThemeId(state, action) {
      if (colorThemes[action.payload]) {
        state.selectedThemeId = action.payload;
      }
    },
  },
});

export const {
  setSelectedThemeId,
} = uiPreferencesSlice.actions;

export const uiPreferencesReducer = uiPreferencesSlice.reducer;
