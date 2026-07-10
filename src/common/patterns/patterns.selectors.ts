import { createSelector } from 'reselect';
import {
  getPatternLengthInQuarterBeats,
  getPatternTotalSteps,
} from '../sequencerModel';
import type { Pattern, PatternsState, SequencerRootState } from '../sequencerModel';
import { selectedPatternIdSelector } from '../song';

type PatternsRootState = SequencerRootState & {
  patterns: PatternsState;
};

export const patternsSelector = (state: PatternsRootState): PatternsState => state.patterns;

export const selectedPatternSelector = createSelector(
  patternsSelector,
  selectedPatternIdSelector,
  (patterns, selectedPatternId): Pattern | undefined => patterns.entities[selectedPatternId],
);

export const selectedPatternNameSelector = createSelector(
  selectedPatternSelector,
  pattern => pattern?.name || '',
);

export const selectedPatternLengthSelector = createSelector(
  selectedPatternSelector,
  pattern => getPatternLengthInQuarterBeats(pattern),
);

export const selectedPatternTotalStepsSelector = createSelector(
  selectedPatternSelector,
  pattern => getPatternTotalSteps(pattern),
);
