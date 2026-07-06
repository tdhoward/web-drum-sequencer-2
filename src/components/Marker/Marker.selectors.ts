import { createStructuredSelector } from 'reselect';
import {
  bpmSelector,
  startTimeSelector,
  playingSelector,
} from '../../common';

export const markerSelectors = createStructuredSelector({
  bpm: bpmSelector,
  startTime: startTimeSelector,
  playing: playingSelector,
});
