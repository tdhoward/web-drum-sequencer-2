import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import {
  DEFAULT_KIT_ID,
  normalizeKitChannelsState,
  sampleIdFromUrl,
} from '../sequencerModel';
import type {
  KitChannel,
  KitChannelInput,
  KitChannelsState,
  VelocityLayer,
} from '../sequencerModel';
import { isValidPercussionType } from '../percussion';
import { createDefaultKitChannelsState } from '../defaultSequencerState';
import {
  getReferenceVelocityLayer,
  transformSampleAlignmentOffset,
  validateVelocityLayers,
} from '../velocityLayers';
import type { SampleAlignmentTransform } from '../velocityLayers';

export const channelsInitialState = createDefaultKitChannelsState();

type ChannelIdPayload = string;

type ChannelSamplePayload = {
  channel: string;
  sampleURL: string;
};

type VelocityLayerSamplePayload = {
  channelId: string;
  layerId: string;
  sampleId: string;
};

type VelocityLayerAlignmentPayload = {
  channelId: string;
  layerId: string;
  alignmentOffset: number;
};

type ReplaceChannelVelocityLayersPayload = {
  channelId: string;
  velocityLayers: VelocityLayer[];
};

type TransformSampleAlignmentsPayload = SampleAlignmentTransform & {
  sampleId: string;
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
          const referenceLayer = getReferenceVelocityLayer(channel.velocityLayers);
          if (referenceLayer) {
            referenceLayer.sampleId = sampleIdFromUrl(action.payload.sampleURL);
          }
        });
      },
      prepare(channel: string, sampleURL: string) {
        return { payload: { channel, sampleURL } };
      },
    },
    setVelocityLayerSample: {
      reducer(state, action: PayloadAction<VelocityLayerSamplePayload>) {
        updateChannel(state, action.payload.channelId, (channel) => {
          const layer = channel.velocityLayers.find(
            velocityLayer => velocityLayer.id === action.payload.layerId,
          );
          if (layer) {
            layer.sampleId = action.payload.sampleId;
          }
        });
      },
      prepare(channelId: string, layerId: string, sampleId: string) {
        return { payload: { channelId, layerId, sampleId } };
      },
    },
    setVelocityLayerAlignment: {
      reducer(state, action: PayloadAction<VelocityLayerAlignmentPayload>) {
        updateChannel(state, action.payload.channelId, (channel) => {
          const layer = channel.velocityLayers.find(
            velocityLayer => velocityLayer.id === action.payload.layerId,
          );
          if (layer) {
            const offset = action.payload.alignmentOffset;
            layer.alignmentOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;
          }
        });
      },
      prepare(channelId: string, layerId: string, alignmentOffset: number) {
        return { payload: { channelId, layerId, alignmentOffset } };
      },
    },
    replaceChannelVelocityLayers(
      state,
      action: PayloadAction<ReplaceChannelVelocityLayersPayload>,
    ) {
      if (validateVelocityLayers(action.payload.velocityLayers).length > 0) {
        return;
      }
      updateChannel(state, action.payload.channelId, (channel) => {
        channel.velocityLayers = action.payload.velocityLayers.map(layer => ({ ...layer }));
      });
    },
    transformChannelSampleAlignments(
      state,
      action: PayloadAction<TransformSampleAlignmentsPayload>,
    ) {
      state.ids.forEach((channelId) => {
        updateChannel(state, channelId, (channel) => {
          channel.velocityLayers.forEach((layer) => {
            if (layer.sampleId === action.payload.sampleId) {
              layer.alignmentOffset = transformSampleAlignmentOffset(
                layer.alignmentOffset,
                action.payload,
              );
            }
          });
        });
      });
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
      const channel = normalizeKitChannelsState(
        [action.payload],
        action.payload.kitId || DEFAULT_KIT_ID,
      ).entities[action.payload.id];
      state.ids.push(channel.id);
      state.entities[channel.id] = channel;
    },
    removeChannel(state, action: PayloadAction<ChannelIdPayload>) {
      state.ids = state.ids.filter(id => id !== action.payload);
      delete state.entities[action.payload];
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
