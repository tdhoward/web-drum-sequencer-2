import * as R from 'ramda';
import { colorThemes, DEFAULT_THEME_ID } from '../../styles/theme';

export const selectedThemeIdSelector = (state) => {
  const selectedThemeId = R.pathOr(
    DEFAULT_THEME_ID,
    ['uiPreferences', 'selectedThemeId'],
    state,
  );

  return colorThemes[selectedThemeId] ? selectedThemeId : DEFAULT_THEME_ID;
};

export const selectedThemeSelector = state => colorThemes[selectedThemeIdSelector(state)];
