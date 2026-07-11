import { createStructuredSelector } from 'reselect';
import {
  bpmSelector,
  startTimeSelector,
  playingSelector,
  selectedPatternLengthSelector,
} from '../../common';

export const markerSelectors = createStructuredSelector({
  bpm: bpmSelector,
  patternLengthInBeats: selectedPatternLengthSelector,
  startTime: startTimeSelector,
  playing: playingSelector,
});
