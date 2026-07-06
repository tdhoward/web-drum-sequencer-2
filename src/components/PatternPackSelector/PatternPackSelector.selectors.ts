import { createSelector, createStructuredSelector } from 'reselect';
import {
  currentPatternPackStateSelector,
  selectedPatternPackSelector,
  userPatternPacksSelector,
} from '../../common';
import type { PatternPack } from '../../common/sequencerModel';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
);

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => deepEqual(item, right[index]));
  }

  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) {
      return false;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(key => (
      Object.prototype.hasOwnProperty.call(right, key)
        && deepEqual(left[key], right[key])
    ));
  }

  return false;
};

const omitPatternPackMetadata = (
  patternPack: PatternPack | undefined,
): Record<string, unknown> | undefined => {
  if (!patternPack) {
    return undefined;
  }

  return Object.entries(patternPack).reduce<Record<string, unknown>>((patternPackState, [key, value]) => {
    if (key !== 'id' && key !== 'name') {
      patternPackState[key] = value;
    }
    return patternPackState;
  }, {});
};

const isEditedSelector = createSelector(
  selectedPatternPackSelector,
  currentPatternPackStateSelector,
  (patternPack, currentState): boolean => !deepEqual(omitPatternPackMetadata(patternPack), currentState),
);

export const patternPackSelectorSelectors = createStructuredSelector({
  currentPatternPack: selectedPatternPackSelector,
  isEdited: isEditedSelector,
  userPatternPacks: userPatternPacksSelector,
});
