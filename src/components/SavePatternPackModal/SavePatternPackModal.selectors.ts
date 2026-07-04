import { createStructuredSelector } from 'reselect';
import {
  patternPackPromptOpenSelector,
  userPatternPacksSelector,
} from '../../common';

export const savePatternPackModalSelectors = createStructuredSelector({
  patternPackPromptOpen: patternPackPromptOpenSelector,
  userPatternPacks: userPatternPacksSelector,
});
