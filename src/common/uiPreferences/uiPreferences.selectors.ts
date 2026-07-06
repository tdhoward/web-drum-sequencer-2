import { colorThemes, DEFAULT_THEME_ID } from '../../styles/theme';
import type { AppTheme } from '../../styles/theme';
import type { UiPreferencesState } from './uiPreferences.reducer';

const themeById = colorThemes as Record<string, AppTheme>;

type UiPreferencesRootState = {
  uiPreferences?: UiPreferencesState;
};

export const selectedThemeIdSelector = (state: UiPreferencesRootState): string => {
  const selectedThemeId = state.uiPreferences?.selectedThemeId || DEFAULT_THEME_ID;

  return themeById[selectedThemeId] ? selectedThemeId : DEFAULT_THEME_ID;
};

export const selectedThemeSelector = (state: UiPreferencesRootState): AppTheme => (
  themeById[selectedThemeIdSelector(state)]
);
