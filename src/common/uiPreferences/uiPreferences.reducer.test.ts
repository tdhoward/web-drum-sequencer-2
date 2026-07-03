import {
  setSelectedThemeId,
  uiPreferencesInitialState,
  uiPreferencesReducer,
} from './uiPreferences.reducer';
import { DEFAULT_THEME_ID, highContrastDarkTheme } from '../../styles/theme';

describe('uiPreferencesReducer', () => {
  test('should set a known selected theme id', () => {
    const state = uiPreferencesReducer(
      uiPreferencesInitialState,
      setSelectedThemeId(highContrastDarkTheme.id),
    );

    expect(state.selectedThemeId).toEqual(highContrastDarkTheme.id);
  });

  test('should ignore unknown selected theme ids', () => {
    const state = uiPreferencesReducer(
      uiPreferencesInitialState,
      setSelectedThemeId('missing-theme'),
    );

    expect(state.selectedThemeId).toEqual(DEFAULT_THEME_ID);
  });
});
