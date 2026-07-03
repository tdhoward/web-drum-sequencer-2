import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import {
  DEFAULT_KIT_ID,
  normalizeKitChannelsState,
  sampleIdFromUrl,
} from '../sequencerModel';
import type { KitChannel, KitChannelInput, KitChannelsState } from '../sequencerModel';
import { PERCUSSION_TYPES, isValidPercussionType } from '../percussion';
import { createDefaultKitChannelsState } from '../defaultSequencerState';

export const channelsInitialState = createDefaultKitChannelsState();

type ChannelIdPayload = string;

type ChannelSamplePayload = {
  channel: string;
  sampleURL: string;
};

type ChannelNumberPayload<TField extends string> = {
  channel: string;
} & Record<TField, number>;

type ChannelBooleanPayload<TField extends string> = {
  channel: string;
} & Record<TField, boolean>;

type ChannelNamePayload = {
  channel: string;
  name: string;
};

type ChannelPercussionTypePayload = {
  channel: string;
  percussionType: string;
};

type SampleLoadedPayload = {
  channelId: string;
  isLoaded: boolean;
};

type UpdateChannelOrderPayload = {
  oldIndex: number;
  newIndex: number;
};

type ReplaceChannelsPayload = {
  channels: KitChannelInput[];
  notes?: unknown;
  kitId: string;
};

const getChannel = (
  state: Draft<KitChannelsState>,
  channelId: string,
): Draft<KitChannel> | undefined => state.entities[channelId];

const updateChannel = (
  state: Draft<KitChannelsState>,
  channelId: string,
  update: (channel: Draft<KitChannel>) => void,
): void => {
  const channel = getChannel(state, channelId);
  if (channel) {
    update(channel);
  }
};

const moveId = (ids: string[], oldIndex: number, newIndex: number): string[] => {
  const nextIds = [...ids];
  const [movedId] = nextIds.splice(oldIndex, 1);
  nextIds.splice(newIndex, 0, movedId);
  return nextIds;
};

export const channelsSlice = createSlice({
  name: 'kitChannels',
  initialState: channelsInitialState,
  reducers: {
    setChannelSample: {
      reducer(state, action: PayloadAction<ChannelSamplePayload>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.sampleId = sampleIdFromUrl(action.payload.sampleURL);
        });
      },
      prepare(channel: string, sampleURL: string) {
        return { payload: { channel, sampleURL } };
      },
    },
    setChannelGain: {
      reducer(state, action: PayloadAction<ChannelNumberPayload<'gain'>>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.gain = action.payload.gain;
        });
      },
      prepare(channel: string, gain: number) {
        return { payload: { channel, gain } };
      },
    },
    setChannelName: {
      reducer(state, action: PayloadAction<ChannelNamePayload>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.name = action.payload.name;
        });
      },
      prepare(channel: string, name: string) {
        return { payload: { channel, name } };
      },
    },
    setChannelPercussionType: {
      reducer(state, action: PayloadAction<ChannelPercussionTypePayload>) {
        if (!isValidPercussionType(action.payload.percussionType)) {
          return;
        }

        updateChannel(state, action.payload.channel, (channel) => {
          channel.percussionType = action.payload.percussionType;
        });
      },
      prepare(channel: string, percussionType: string) {
        return { payload: { channel, percussionType } };
      },
    },
    setChannelPan: {
      reducer(state, action: PayloadAction<ChannelNumberPayload<'pan'>>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.pan = action.payload.pan;
        });
      },
      prepare(channel: string, pan: number) {
        return { payload: { channel, pan } };
      },
    },
    setChannelPitchCoarse: {
      reducer(state, action: PayloadAction<ChannelNumberPayload<'pitchCoarse'>>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.pitchCoarse = action.payload.pitchCoarse;
        });
      },
      prepare(channel: string, pitchCoarse: number) {
        return { payload: { channel, pitchCoarse } };
      },
    },
    setChannelPitchFine: {
      reducer(state, action: PayloadAction<ChannelNumberPayload<'pitchFine'>>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.pitchFine = action.payload.pitchFine;
        });
      },
      prepare(channel: string, pitchFine: number) {
        return { payload: { channel, pitchFine } };
      },
    },
    setChannelReverb: {
      reducer(state, action: PayloadAction<ChannelNumberPayload<'reverb'>>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.reverb = action.payload.reverb;
        });
      },
      prepare(channel: string, reverb: number) {
        return { payload: { channel, reverb } };
      },
    },
    addChannel(state, action: PayloadAction<KitChannelInput>) {
      const channel: KitChannel = {
        ...action.payload,
        kitId: action.payload.kitId || DEFAULT_KIT_ID,
        laneId: action.payload.laneId || action.payload.id,
        percussionType: action.payload.percussionType || PERCUSSION_TYPES.GENERIC_PERCUSSION,
        sampleId: action.payload.sampleId || sampleIdFromUrl(action.payload.sample),
      };
      state.ids.push(channel.id);
      state.entities[channel.id] = channel;
    },
    removeChannel(state, action: PayloadAction<ChannelIdPayload>) {
      state.ids = state.ids.filter(id => id !== action.payload);
      delete state.entities[action.payload];
    },
    sampleLoaded: {
      reducer(state, action: PayloadAction<SampleLoadedPayload>) {
        updateChannel(state, action.payload.channelId, (channel) => {
          channel.sampleLoaded = action.payload.isLoaded;
        });
      },
      prepare(channelId: string, isLoaded: boolean) {
        return { payload: { channelId, isLoaded } };
      },
    },
    setChannelMuted: {
      reducer(state, action: PayloadAction<ChannelBooleanPayload<'muted'>>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.muted = action.payload.muted;
          channel.solo = false;
        });
      },
      prepare(channel: string, muted: boolean) {
        return { payload: { channel, muted } };
      },
    },
    setChannelSolo: {
      reducer(state, action: PayloadAction<ChannelBooleanPayload<'solo'>>) {
        updateChannel(state, action.payload.channel, (channel) => {
          channel.solo = action.payload.solo;
          channel.muted = false;
        });
      },
      prepare(channel: string, solo: boolean) {
        return { payload: { channel, solo } };
      },
    },
    updateChannelOrder: {
      reducer(state, action: PayloadAction<UpdateChannelOrderPayload>) {
        state.ids = moveId(
          state.ids,
          action.payload.oldIndex,
          action.payload.newIndex,
        );
      },
      prepare(oldIndex: number, newIndex: number) {
        return { payload: { oldIndex, newIndex } };
      },
    },
    replaceChannels: {
      reducer(state, action: PayloadAction<ReplaceChannelsPayload>) {
        return normalizeKitChannelsState(action.payload.channels, action.payload.kitId);
      },
      prepare(channels: KitChannelInput[], notes: unknown = {}, kitId = DEFAULT_KIT_ID) {
        return { payload: { channels, notes, kitId } };
      },
    },
    replaceKitChannels: {
      reducer(state, action: PayloadAction<ReplaceChannelsPayload>) {
        return normalizeKitChannelsState(action.payload.channels, action.payload.kitId);
      },
      prepare(channels: KitChannelInput[], kitId = DEFAULT_KIT_ID) {
        return { payload: { channels, kitId } };
      },
    },
  },
});

export const channelsReducer = channelsSlice.reducer;
