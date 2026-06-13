const emptySamplesState = { ids: [], entities: {} };

export const samplesSelector = state => state.samples || emptySamplesState;
