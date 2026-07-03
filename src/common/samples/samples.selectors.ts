import type { SamplesState, SequencerRootState } from '../sequencerModel';

const emptySamplesState: SamplesState = { ids: [], entities: {} };

type SamplesRootState = SequencerRootState & {
  samples?: SamplesState;
};

export const samplesSelector = (state: SamplesRootState): SamplesState => (
  state.samples || emptySamplesState
);
