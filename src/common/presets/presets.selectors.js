import * as R from 'ramda';
import { createSelector } from 'reselect';
import { channelsStateSelector } from '../channels';
import { selectedKitSelector } from '../kits';
import { samplesSelector } from '../samples';

export const userPresetsSelector = R.path(['presets', 'userPresets']);

export const presetSelector = R.path(['presets', 'preset']);

export const currentKitPresetStateSelector = createSelector(
  channelsStateSelector,
  selectedKitSelector,
  samplesSelector,
  (channels, selectedKit, samples) => {
    const channelIds = selectedKit?.channelIds || channels.ids;
    return {
      channels: channelIds
        .map(channelId => channels.entities[channelId])
        .filter(Boolean)
        .map((channel) => {
          const sample = samples.entities[channel.sampleId];
          return R.omit(
            ['sampleLoaded', 'noteIds', 'sampleId', 'kitId'],
            {
              ...channel,
              sample: sample?.url || channel.sample,
            },
          );
        }),
    };
  },
);

export const currentStateSelector = currentKitPresetStateSelector;
