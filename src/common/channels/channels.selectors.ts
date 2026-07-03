// Legacy UI/audio compatibility: returns the selected kit as the old channel array shape.
import { createSelector } from 'reselect';
import { selectedKitSelector } from '../kits';
import { kitChannelAssignmentsSelector } from '../kitChannelAssignments';
import { samplesSelector } from '../samples';
import type {
  KitChannel,
  KitChannelsState,
  SequencerRootState,
} from '../sequencerModel';

const emptyChannelsState: KitChannelsState = { ids: [], entities: {} };

type ChannelsRootState = SequencerRootState & {
  channels?: KitChannelsState;
  kitChannels?: KitChannelsState;
};

export type LegacyChannel = KitChannel & {
  id: string;
  kitChannelId: string;
  sample?: string;
};

export const channelsStateSelector = (state: ChannelsRootState): KitChannelsState => (
  state.kitChannels || state.channels || emptyChannelsState
);

export const channelsSelector = createSelector(
  channelsStateSelector,
  selectedKitSelector,
  kitChannelAssignmentsSelector,
  samplesSelector,
  (channels, selectedKit, assignments, samples): LegacyChannel[] => {
    const channelIds = selectedKit?.channelIds || channels.ids;
    const selectedKitChannels = channelIds
      .map(id => channels.entities[id])
      .filter((channel): channel is KitChannel => Boolean(channel));
    const resolvedChannels = selectedKitChannels.length
      ? selectedKitChannels
      : (channels.ids || [])
        .map(id => channels.entities[id])
        .filter((channel): channel is KitChannel => Boolean(channel));
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
