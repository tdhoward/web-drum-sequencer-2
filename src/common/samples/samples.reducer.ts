import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import { createSamplesState, sampleIdFromUrl } from '../sequencerModel';
import type { SamplesState } from '../sequencerModel';
import { createDefaultSamplesState } from '../defaultSequencerState';
import { channelsSlice } from '../channels/channels.reducer';

export const samplesInitialState = createDefaultSamplesState();

type AddSampleFromUrlPayload = {
  sampleURL?: string;
  sourceType: string;
};

type RenameSampleFromUrlPayload = {
  sampleURL: string;
  name: string;
};

type RemoveSampleFromUrlPayload = {
  sampleURL: string;
};

const upsertSampleFromUrl = (
  state: Draft<SamplesState>,
  sampleURL?: string,
  sourceType = 'factory',
  name = sampleURL,
): void => {
  const sampleId = sampleIdFromUrl(sampleURL);
  if (!state.ids.includes(sampleId)) {
    state.ids.push(sampleId);
  }
  state.entities[sampleId] = {
    id: sampleId,
    name,
    url: sampleURL,
    sourceType,
  };
};

export const samplesSlice = createSlice({
  name: 'samples',
  initialState: samplesInitialState,
  reducers: {
    addSampleFromUrl: {
      reducer(state, action: PayloadAction<AddSampleFromUrlPayload>) {
        upsertSampleFromUrl(
          state,
          action.payload.sampleURL,
          action.payload.sourceType,
        );
      },
      prepare(sampleURL: string, sourceType = 'user') {
        return { payload: { sampleURL, sourceType } };
      },
    },
    renameSampleFromUrl: {
      reducer(state, action: PayloadAction<RenameSampleFromUrlPayload>) {
        const sampleId = sampleIdFromUrl(action.payload.sampleURL);
        const sample = state.entities[sampleId];
        if (sample) {
          sample.name = action.payload.name;
        }
      },
      prepare(sampleURL: string, name: string) {
        return { payload: { sampleURL, name } };
      },
    },
    removeSampleFromUrl: {
      reducer(state, action: PayloadAction<RemoveSampleFromUrlPayload>) {
        const sampleId = sampleIdFromUrl(action.payload.sampleURL);
        state.ids = state.ids.filter(id => id !== sampleId);
        delete state.entities[sampleId];
      },
      prepare(sampleURL: string) {
        return { payload: { sampleURL } };
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
      .addCase(channelsSlice.actions.replaceChannels, (state, action) => (
        createSamplesState(action.payload.channels)
      ))
      .addCase(channelsSlice.actions.replaceKitChannels, (state, action) => (
        createSamplesState(action.payload.channels)
      ));
  },
});

export const {
  addSampleFromUrl,
  renameSampleFromUrl,
  removeSampleFromUrl,
} = samplesSlice.actions;

export const samplesReducer = samplesSlice.reducer;
