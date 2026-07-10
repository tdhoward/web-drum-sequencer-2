import { createSelector, createStructuredSelector } from 'reselect';
import {
  currentPatternPackStateSelector,
  selectedPatternPackSelector,
  userPatternPacksSelector,
} from '../../common';
import { deepEqual, omitFields } from '../../common/presetMemory';

const patternPackMetadataFields = new Set(['id', 'name']);

const isEditedSelector = createSelector(
  selectedPatternPackSelector,
  currentPatternPackStateSelector,
  (patternPack, currentState): boolean => !deepEqual(
    omitFields(patternPack, patternPackMetadataFields),
    currentState,
  ),
);

export const patternPackSelectorSelectors = createStructuredSelector({
  currentPatternPack: selectedPatternPackSelector,
  isEdited: isEditedSelector,
  userPatternPacks: userPatternPacksSelector,
});
