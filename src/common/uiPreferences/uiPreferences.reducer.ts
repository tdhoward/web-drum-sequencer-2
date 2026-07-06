import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { colorThemes, DEFAULT_THEME_ID } from '../../styles/theme';

const themeById = colorThemes as Record<string, unknown>;

export type UiPreferencesState = {
  selectedThemeId: string;
};

export const uiPreferencesInitialState: UiPreferencesState = {
  selectedThemeId: DEFAULT_THEME_ID,
};

export const uiPreferencesSlice = createSlice({
  name: 'uiPreferences',
  initialState: uiPreferencesInitialState,
  reducers: {
    setSelectedThemeId(state, action: PayloadAction<string>) {
      if (themeById[action.payload]) {
        state.selectedThemeId = action.payload;
      }
    },
  },
});

export const {
  setSelectedThemeId,
} = uiPreferencesSlice.actions;

export const uiPreferencesReducer = uiPreferencesSlice.reducer;
