// Legacy UI/audio compatibility: returns the selected kit as the old channel array shape.
import { createSelector } from 'reselect';
import { selectedKitSelector } from '../kits';
import { kitChannelAssignmentsSelector } from '../kitChannelAssignments';
import { samplesSelector } from '../samples';

export const channelsStateSelector = state => state.kitChannels || state.channels;

export const channelsSelector = createSelector(
  channelsStateSelector,
  selectedKitSelector,
  kitChannelAssignmentsSelector,
  samplesSelector,
  (channels, selectedKit, assignments, samples) => {
    const channelIds = selectedKit?.channelIds || channels.ids;
    const selectedKitChannels = channelIds
      .map(id => channels.entities[id])
      .filter(Boolean);
    const resolvedChannels = selectedKitChannels.length
      ? selectedKitChannels
      : (channels.ids || []).map(id => channels.entities[id]).filter(Boolean);
    return resolvedChannels
      .map((channel) => {
        const sample = samples.entities[channel.sampleId];
        const assignment = assignments.entities[channel.id];
        return {
          ...channel,
          id: assignment?.laneId || channel.laneId || channel.id,
          kitChannelId: channel.id,
          sample: sample?.url || channel.sample,
        };
      });
  },
);
