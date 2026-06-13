import { createSelector } from 'reselect';
import { selectedKitSelector } from '../kits';
import { samplesSelector } from '../samples';

export const channelsStateSelector = state => state.kitChannels || state.channels;

export const channelsSelector = createSelector(
  channelsStateSelector,
  selectedKitSelector,
  samplesSelector,
  (channels, selectedKit, samples) => {
    const channelIds = selectedKit?.channelIds || channels.ids;
    return channelIds
      .map(id => channels.entities[id])
      .filter(Boolean)
      .map((channel) => {
        const sample = samples.entities[channel.sampleId];
        return {
          ...channel,
          id: channel.laneId || channel.id,
          kitChannelId: channel.id,
          sample: sample?.url || channel.sample,
        };
      });
  },
);
