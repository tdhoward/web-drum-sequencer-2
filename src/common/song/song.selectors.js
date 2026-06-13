import { createSelector } from 'reselect';
import { patternIdToIndex } from '../sequencerModel';

export const songSelector = state => state.song;

export const selectedPatternIdSelector = createSelector(
  songSelector,
  song => song.selectedPatternId,
);

export const selectedKitIdSelector = createSelector(
  songSelector,
  song => song.selectedKitId,
);

export const patternSelector = createSelector(
  selectedPatternIdSelector,
  selectedPatternId => patternIdToIndex(selectedPatternId),
);
