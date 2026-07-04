import { createStructuredSelector } from 'reselect';
import {
  bpmSelector,
  playingSelector,
  startTimeSelector,
} from '../../common';

export const bpmInputSelectors = createStructuredSelector({
  bpm: bpmSelector,
  playing: playingSelector,
  startTime: startTimeSelector,
});
