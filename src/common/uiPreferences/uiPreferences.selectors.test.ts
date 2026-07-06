import {
  selectedThemeIdSelector,
  selectedThemeSelector,
} from './uiPreferences.selectors';
import { DEFAULT_THEME_ID, highContrastDarkTheme } from '../../styles/theme';

describe('uiPreferences selectors', () => {
  test('should select a known selected theme', () => {
    const state = {
      uiPreferences: {
        selectedThemeId: highContrastDarkTheme.id,
      },
    };

    expect(selectedThemeIdSelector(state)).toEqual(highContrastDarkTheme.id);
    expect(selectedThemeSelector(state)).toEqual(highContrastDarkTheme);
  });

  test('should fall back to the default theme when persisted theme id is unknown', () => {
    const state = {
      uiPreferences: {
        selectedThemeId: 'missing-theme',
      },
    };

    expect(selectedThemeIdSelector(state)).toEqual(DEFAULT_THEME_ID);
  });
});
