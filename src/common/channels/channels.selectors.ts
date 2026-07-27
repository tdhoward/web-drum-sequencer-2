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
import type { VelocityLayer } from '../velocityLayers';
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

export type PlaybackVelocityLayer = VelocityLayer & {
  sample?: string;
  sampleContentHash?: string;
  sampleLoaded?: boolean;
};

export type LegacyChannel = KitChannel & {
  id: string;
  kitChannelId: string;
  velocityLayers: PlaybackVelocityLayer[];
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
      const velocityLayers = channel.velocityLayers.map((layer) => {
        const layerSample = samples.entities[layer.sampleId];
        return {
          ...layer,
          sample: layerSample?.url,
          sampleContentHash: layerSample?.contentHash,
          sampleLoaded: sampleLoadStatus[layer.sampleId]
            === SAMPLE_LOAD_STATUSES.LOADED,
        };
      });
      const referenceLayer = getReferenceVelocityLayer(
        velocityLayers,
      ) as PlaybackVelocityLayer | undefined;
      if (!referenceLayer) {
        return result;
      }
      const assignment = assignments.entities[channel.id];
      result.push({
        ...channel,
        velocityLayers,
        id: assignment?.laneId || channel.laneId || channel.id,
        kitChannelId: channel.id,
        sampleId: referenceLayer.sampleId,
        referenceVelocityLayerId: referenceLayer.id,
        sample: referenceLayer.sample,
        sampleContentHash: referenceLayer.sampleContentHash,
        alignmentOffset: referenceLayer.alignmentOffset,
        sampleLoaded: referenceLayer.sampleLoaded,
      });
      return result;
    }, []);
  },
);
