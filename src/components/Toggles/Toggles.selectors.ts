import { createStructuredSelector } from 'reselect';
import {
  bpmSelector,
  playingSelector,
  patternSelector,
  selectedPatternQuarterBeatsPerStepSelector,
  selectedPatternStepsPerBeatSelector,
  selectedPatternTotalStepsSelector,
} from '../../common';

export const togglesSelectors = createStructuredSelector({
  bpm: bpmSelector,
  playing: playingSelector,
  pattern: patternSelector,
  quarterBeatsPerStep: selectedPatternQuarterBeatsPerStepSelector,
  stepsPerBeat: selectedPatternStepsPerBeatSelector,
  totalSteps: selectedPatternTotalStepsSelector,
});
