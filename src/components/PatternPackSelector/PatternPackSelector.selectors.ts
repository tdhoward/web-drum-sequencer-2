import { createStructuredSelector } from 'reselect';
import {
  isCurrentPatternPackEditedSelector,
  selectedPatternPackSelector,
  userPatternPacksSelector,
} from '../../common';

export const patternPackSelectorSelectors = createStructuredSelector({
  currentPatternPack: selectedPatternPackSelector,
  isEdited: isCurrentPatternPackEditedSelector,
  userPatternPacks: userPatternPacksSelector,
});
