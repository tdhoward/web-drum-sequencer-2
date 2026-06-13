import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';
import { createSamplesState, sampleIdFromUrl } from '../sequencerModel';
import { channelsSlice } from '../channels/channels.reducer';

export const samplesInitialState = createSamplesState(presets[1].channels);

const upsertSampleFromUrl = (state, sampleURL, sourceType = 'factory') => {
  const sampleId = sampleIdFromUrl(sampleURL);
  if (!state.ids.includes(sampleId)) {
    state.ids.push(sampleId);
  }
  state.entities[sampleId] = {
    id: sampleId,
    name: sampleURL,
    url: sampleURL,
    sourceType,
  };
};

export const samplesSlice = createSlice({
  name: 'samples',
  initialState: samplesInitialState,
  reducers: {
    addSampleFromUrl: {
      reducer(state, action) {
        upsertSampleFromUrl(
          state,
          action.payload.sampleURL,
          action.payload.sourceType,
        );
      },
      prepare(sampleURL, sourceType = 'user') {
        return { payload: { sampleURL, sourceType } };
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(channelsSlice.actions.addChannel, (state, action) => {
        upsertSampleFromUrl(state, action.payload.sample);
      })
      .addCase(channelsSlice.actions.setChannelSample, (state, action) => {
        upsertSampleFromUrl(state, action.payload.sampleURL, 'user');
      })
      .addCase(channelsSlice.actions.replaceChannels, (state, action) => {
        return createSamplesState(action.payload.channels);
      });
  },
});

export const {
  addSampleFromUrl,
} = samplesSlice.actions;

export const samplesReducer = samplesSlice.reducer;
