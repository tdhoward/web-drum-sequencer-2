import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const SAMPLE_LOAD_STATUSES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
} as const;

export type SampleLoadStatus = typeof SAMPLE_LOAD_STATUSES[
keyof typeof SAMPLE_LOAD_STATUSES
];

export type SampleLoadStatusState = Record<string, SampleLoadStatus>;

export const sampleLoadStatusInitialState: SampleLoadStatusState = {};

type SetSampleLoadStatusPayload = {
  sampleId: string;
  status: SampleLoadStatus;
};

export const sampleLoadStatusSlice = createSlice({
  name: 'sampleLoadStatus',
  initialState: sampleLoadStatusInitialState,
  reducers: {
    setSampleLoadStatus(state, action: PayloadAction<SetSampleLoadStatusPayload>) {
      state[action.payload.sampleId] = action.payload.status;
    },
  },
});

export const { setSampleLoadStatus } = sampleLoadStatusSlice.actions;
export const sampleLoadStatusReducer = sampleLoadStatusSlice.reducer;
