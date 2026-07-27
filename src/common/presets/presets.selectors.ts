import { createSelector } from 'reselect';
import { channelsStateSelector } from '../channels';
import { selectedKitSelector } from '../kits';
import { samplesSelector } from '../samples';
import {
  createSamplesState,
  normalizeKitChannelsState,
} from '../sequencerModel';
import type {
  KitChannel,
  KitChannelInput,
  SamplesState,
  SequencerRootState,
} from '../sequencerModel';
import type { PresetsState, UserPreset } from './presets.reducer';

type PresetsRootState = SequencerRootState & {
  presets?: PresetsState;
};

type CurrentKitPresetChannel = KitChannelInput;

export type CurrentKitPresetState = {
  channels: CurrentKitPresetChannel[];
};

export type KitPresetStateInput = {
  channels?: KitChannelInput[];
};

const transientChannelFields = [
  'sampleLoaded',
  'noteIds',
  'sample',
  'sampleId',
  'alignmentOffset',
  'kitId',
];

const channelToPresetInput = (
  channel: KitChannel,
  samples: SamplesState,
): CurrentKitPresetChannel => {
  const presetChannel = { ...channel } as Record<string, unknown>;
  transientChannelFields.forEach((field) => {
    delete presetChannel[field];
  });
  presetChannel.velocityLayers = channel.velocityLayers.map(layer => ({
    ...layer,
    ...(samples.entities[layer.sampleId]?.url
      ? { sample: samples.entities[layer.sampleId].url }
      : {}),
  }));
  return presetChannel as CurrentKitPresetChannel;
};

export const normalizeKitPresetState = (
  preset: KitPresetStateInput | undefined,
): CurrentKitPresetState | undefined => {
  if (!preset || !Array.isArray(preset.channels)) {
    return undefined;
  }

  const samples = createSamplesState(preset.channels);
  const channels = normalizeKitChannelsState(preset.channels, undefined, samples);
  return {
    channels: channels.ids
      .map(channelId => channels.entities[channelId])
      .filter((channel): channel is KitChannel => Boolean(channel))
      .map(channel => channelToPresetInput(channel, samples)),
  };
};

export const userPresetsSelector = (state: PresetsRootState): UserPreset[] | undefined => (
  state.presets?.userPresets
);

export const presetSelector = (state: PresetsRootState): string | undefined => state.presets?.preset;

export const currentKitPresetStateSelector = createSelector(
  channelsStateSelector,
  selectedKitSelector,
  samplesSelector,
  (channels, selectedKit, samples): CurrentKitPresetState => {
    const channelIds = selectedKit?.channelIds || channels.ids;
    return {
      channels: channelIds
        .map(channelId => channels.entities[channelId])
        .filter((channel): channel is KitChannel => Boolean(channel))
        .map(channel => channelToPresetInput(channel, samples)),
    };
  },
);

export const currentStateSelector = currentKitPresetStateSelector;
