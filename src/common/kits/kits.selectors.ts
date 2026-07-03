import { createSelector } from 'reselect';
import { selectedKitIdSelector } from '../song';
import type { KitsState, SequencerRootState } from '../sequencerModel';

const emptyKitsState: KitsState = { ids: [], entities: {} };

type KitsRootState = SequencerRootState & {
  kits?: KitsState;
};

export const kitsSelector = (state: KitsRootState): KitsState => state.kits || emptyKitsState;

export const selectedKitSelector = createSelector(
  kitsSelector,
  selectedKitIdSelector,
  (kits, selectedKitId) => kits.entities[selectedKitId],
);
