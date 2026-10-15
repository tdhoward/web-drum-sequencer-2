import type { SampleLoadStatusState } from './sampleLoadStatus.reducer';

const emptySampleLoadStatus: SampleLoadStatusState = {};

type SampleLoadStatusRootState = {
  sampleLoadStatus?: SampleLoadStatusState;
};

export const sampleLoadStatusSelector = (
  state: SampleLoadStatusRootState,
): SampleLoadStatusState => state.sampleLoadStatus || emptySampleLoadStatus;
