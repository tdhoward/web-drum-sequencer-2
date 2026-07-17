import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  MappingReviewState,
  PendingMappingReview,
} from './mappingReview.types';

export const mappingReviewInitialState: MappingReviewState = {
  pending: null,
};

export const mappingReviewSlice = createSlice({
  name: 'mappingReview',
  initialState: mappingReviewInitialState,
  reducers: {
    openMappingReview(state, action: PayloadAction<PendingMappingReview>) {
      state.pending = action.payload;
    },
    closeMappingReview(state) {
      state.pending = null;
    },
  },
});

export const {
  openMappingReview,
  closeMappingReview,
} = mappingReviewSlice.actions;

export const mappingReviewReducer = mappingReviewSlice.reducer;

