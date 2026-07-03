import { colorThemes, DEFAULT_THEME_ID } from '../../styles/theme';
import type { UiPreferencesState } from './uiPreferences.reducer';

const themeById = colorThemes as Record<string, unknown>;

type UiPreferencesRootState = {
  uiPreferences?: UiPreferencesState;
};

export const selectedThemeIdSelector = (state: UiPreferencesRootState): string => {
  const selectedThemeId = state.uiPreferences?.selectedThemeId || DEFAULT_THEME_ID;

  return themeById[selectedThemeId] ? selectedThemeId : DEFAULT_THEME_ID;
};

export const selectedThemeSelector = (state: UiPreferencesRootState) => (
  themeById[selectedThemeIdSelector(state)]
);
