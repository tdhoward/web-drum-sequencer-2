import { createSelector } from 'reselect';
import { patternIdToIndex } from '../sequencerModel';

export const songSelector = state => state.song;

export const selectedPatternIdSelector = createSelector(
  songSelector,
  song => song.selectedPatternId,
);

export const patternSelector = createSelector(
  selectedPatternIdSelector,
  selectedPatternId => patternIdToIndex(selectedPatternId),
);
