import type { MappingReviewState } from './mappingReview.types';

type MappingReviewRootState = {
  mappingReview?: MappingReviewState;
};

export const pendingMappingReviewSelector = (
  state: MappingReviewRootState,
) => state.mappingReview?.pending || null;

