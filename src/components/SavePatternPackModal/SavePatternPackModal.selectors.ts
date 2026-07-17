import { createStructuredSelector } from 'reselect';
import {
  patternPackPromptOpenSelector,
  patternPackRenamePromptSelector,
  selectedPatternPackSelector,
  userPatternPacksSelector,
} from '../../common';

export const savePatternPackModalSelectors = createStructuredSelector({
  patternPackPromptOpen: patternPackPromptOpenSelector,
  renamePrompt: patternPackRenamePromptSelector,
  selectedPatternPack: selectedPatternPackSelector,
  userPatternPacks: userPatternPacksSelector,
});
