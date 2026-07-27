// Legacy UI/audio compatibility: returns the selected kit as the old channel array shape.
import { createSelector } from 'reselect';
import { selectedKitSelector } from '../kits';
import { kitChannelAssignmentsSelector } from '../kitChannelAssignments';
import { samplesSelector } from '../samples';
import {
  SAMPLE_LOAD_STATUSES,
  sampleLoadStatusSelector,
} from '../sampleLoadStatus';
import { getReferenceVelocityLayer } from '../velocityLayers';
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
  sampleId: string;
  referenceVelocityLayerId: string;
  sample?: string;
  sampleContentHash?: string;
  alignmentOffset?: number;
  sampleLoaded?: boolean;
};

export const channelsStateSelector = (state: ChannelsRootState): KitChannelsState => (
  state.kitChannels || state.channels || emptyChannelsState
);

export const channelsSelector = createSelector(
  channelsStateSelector,
  selectedKitSelector,
  kitChannelAssignmentsSelector,
  samplesSelector,
  sampleLoadStatusSelector,
  (channels, selectedKit, assignments, samples, sampleLoadStatus): LegacyChannel[] => {
    const channelIds = selectedKit?.channelIds || channels.ids;
    const selectedKitChannels = channelIds
      .map(id => channels.entities[id])
      .filter((channel): channel is KitChannel => Boolean(channel));
    const resolvedChannels = selectedKitChannels.length
      ? selectedKitChannels
      : (channels.ids || [])
        .map(id => channels.entities[id])
        .filter((channel): channel is KitChannel => Boolean(channel));
    return resolvedChannels.reduce<LegacyChannel[]>((result, channel) => {
      const referenceLayer = getReferenceVelocityLayer(channel.velocityLayers);
      if (!referenceLayer) {
        return result;
      }
      const sample = samples.entities[referenceLayer.sampleId];
      const assignment = assignments.entities[channel.id];
      result.push({
        ...channel,
        id: assignment?.laneId || channel.laneId || channel.id,
        kitChannelId: channel.id,
        sampleId: referenceLayer.sampleId,
        referenceVelocityLayerId: referenceLayer.id,
        sample: sample?.url,
        sampleContentHash: sample?.contentHash,
        alignmentOffset: referenceLayer.alignmentOffset,
        sampleLoaded: sampleLoadStatus[referenceLayer.sampleId]
          === SAMPLE_LOAD_STATUSES.LOADED,
      });
      return result;
    }, []);
  },
);
