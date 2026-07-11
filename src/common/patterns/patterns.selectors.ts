import { createSelector } from 'reselect';
import {
  getQuarterBeatsPerStep,
  getPatternLengthInQuarterBeats,
  getPatternTotalSteps,
  normalizePatternSettings,
} from '../sequencerModel';
import type { Pattern, PatternSettings, PatternsState, SequencerRootState } from '../sequencerModel';
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

export const selectedPatternSettingsSelector = createSelector(
  selectedPatternSelector,
  (pattern): PatternSettings => normalizePatternSettings(pattern),
);

export const selectedPatternLengthSelector = createSelector(
  selectedPatternSettingsSelector,
  patternSettings => getPatternLengthInQuarterBeats(patternSettings),
);

export const selectedPatternTotalStepsSelector = createSelector(
  selectedPatternSettingsSelector,
  patternSettings => getPatternTotalSteps(patternSettings),
);

export const selectedPatternTimeSignatureSelector = createSelector(
  selectedPatternSettingsSelector,
  patternSettings => patternSettings.timeSignature,
);

export const selectedPatternStepsPerBeatSelector = createSelector(
  selectedPatternSettingsSelector,
  patternSettings => patternSettings.stepsPerBeat,
);

export const selectedPatternBeatsPerBarSelector = createSelector(
  selectedPatternTimeSignatureSelector,
  timeSignature => timeSignature.beatsPerBar,
);

export const selectedPatternQuarterBeatsPerStepSelector = createSelector(
  selectedPatternSettingsSelector,
  patternSettings => getQuarterBeatsPerStep(patternSettings),
);
