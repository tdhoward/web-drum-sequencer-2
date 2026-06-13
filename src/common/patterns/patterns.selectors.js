import { createSelector } from 'reselect';
import {
  getPatternLengthInQuarterBeats,
  getPatternTotalSteps,
} from '../sequencerModel';
import { selectedPatternIdSelector } from '../song';

export const patternsSelector = state => state.patterns;

export const selectedPatternSelector = createSelector(
  patternsSelector,
  selectedPatternIdSelector,
  (patterns, selectedPatternId) => patterns.entities[selectedPatternId],
);

export const selectedPatternLengthSelector = createSelector(
  selectedPatternSelector,
  pattern => getPatternLengthInQuarterBeats(pattern),
);

export const selectedPatternTotalStepsSelector = createSelector(
  selectedPatternSelector,
  pattern => getPatternTotalSteps(pattern),
);
