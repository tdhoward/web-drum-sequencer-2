import { createSelector } from 'reselect';
import { patternIdToIndex } from '../sequencerModel';
import type { SequencerRootState, SongState } from '../sequencerModel';

type SongRootState = SequencerRootState & {
  song: SongState;
};

export const songSelector = (state: SongRootState): SongState => state.song;

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
