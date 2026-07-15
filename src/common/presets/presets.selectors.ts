import { createSelector } from 'reselect';
import { channelsStateSelector } from '../channels';
import { selectedKitSelector } from '../kits';
import { samplesSelector } from '../samples';
import { normalizeKitChannelsState } from '../sequencerModel';
import type { KitChannel, KitChannelInput, SequencerRootState } from '../sequencerModel';
import type { PresetsState, UserPreset } from './presets.reducer';

type PresetsRootState = SequencerRootState & {
  presets?: PresetsState;
};

type CurrentKitPresetChannel = Omit<KitChannel, 'sampleId' | 'kitId'> & {
  id: string;
  sample?: string;
};

export type CurrentKitPresetState = {
  channels: CurrentKitPresetChannel[];
};

export type KitPresetStateInput = {
  channels?: KitChannelInput[];
};

const transientChannelFields = ['sampleLoaded', 'noteIds', 'sampleId', 'kitId'];

const omitTransientChannelFields = (channel: KitChannel): CurrentKitPresetChannel => {
  const presetChannel = { ...channel } as Record<string, unknown>;
  transientChannelFields.forEach((field) => {
    delete presetChannel[field];
  });
  return presetChannel as CurrentKitPresetChannel;
};

export const normalizeKitPresetState = (
  preset: KitPresetStateInput | undefined,
): CurrentKitPresetState | undefined => {
  if (!preset || !Array.isArray(preset.channels)) {
    return undefined;
  }

  const channels = normalizeKitChannelsState(preset.channels);
  return {
    channels: channels.ids
      .map(channelId => channels.entities[channelId])
      .filter((channel): channel is KitChannel => Boolean(channel))
      .map(omitTransientChannelFields),
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
        .map((channel) => {
          const sample = samples.entities[channel.sampleId];
          return omitTransientChannelFields({
            ...channel,
            sample: sample?.url || channel.sample,
            ...(sample?.alignmentOffset
              ? { alignmentOffset: sample.alignmentOffset }
              : {}),
          });
        }),
    };
  },
);

export const currentStateSelector = currentKitPresetStateSelector;
