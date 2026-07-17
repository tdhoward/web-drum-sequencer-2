import {
  closeMappingReview,
  mappingReviewReducer,
  mappingReviewInitialState,
  openMappingReview,
} from './mappingReview.reducer';
import type { PendingMappingReview } from './mappingReview.types';

const pendingReview: PendingMappingReview = {
  operation: {
    type: 'patternPack',
    patternPack: {
      id: 'pack-1',
      name: 'Test Pack',
      bpm: 120,
      swing: 0,
      lanes: [],
      notes: {},
    },
  },
  mappingResult: {
    mappings: [],
    unresolved: [],
  },
  targetKitChannels: [],
};

describe('mapping review reducer', () => {
  test('opens and cancels a pending review', () => {
    const openState = mappingReviewReducer(
      mappingReviewInitialState,
      openMappingReview(pendingReview),
    );
    expect(openState.pending).toEqual(pendingReview);

    const closedState = mappingReviewReducer(openState, closeMappingReview());
    expect(closedState.pending).toBeNull();
  });
});

