import { createSelector } from 'reselect';
import { selectedKitIdSelector } from '../song';

const emptyKitsState = { ids: [], entities: {} };

export const kitsSelector = state => state.kits || emptyKitsState;

export const selectedKitSelector = createSelector(
  kitsSelector,
  selectedKitIdSelector,
  (kits, selectedKitId) => kits.entities[selectedKitId],
);
