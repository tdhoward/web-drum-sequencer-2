import {
  getVelocityLayerRange,
  sampleIdFromUrl,
  type VelocityLayer,
} from '../velocityLayers';

type UsageVelocityLayer = VelocityLayer & {
  sample?: string;
};

export type SampleUsageChannel = {
  id: string;
  kitChannelId?: string;
  name?: unknown;
  velocityLayers: readonly UsageVelocityLayer[];
};

export type SampleUsage = {
  channelId: string;
  channelLabel: string;
  layerId: string;
  layerIndex: number;
  layerCount: number;
  minVelocity: number;
  maxVelocity: number;
};

const normalizedSampleIds = (sampleReference: string): Set<string> => new Set([
  sampleReference,
  sampleIdFromUrl(sampleReference),
]);

const getChannelLabel = (channel: SampleUsageChannel): string => (
  typeof channel.name === 'string' && channel.name.trim()
    ? channel.name.trim()
    : channel.kitChannelId || channel.id
);

export const getSampleUsages = (
  sampleReference: string,
  channels: readonly SampleUsageChannel[],
): SampleUsage[] => {
  const matchingSampleIds = normalizedSampleIds(sampleReference);

  return channels.flatMap((channel) => (
    channel.velocityLayers.flatMap((layer, layerIndex) => {
      const range = getVelocityLayerRange(channel.velocityLayers, layerIndex);
      const matchesSample = matchingSampleIds.has(layer.sampleId)
        || layer.sample === sampleReference;
      if (!matchesSample || !range) {
        return [];
      }

      return [{
        channelId: channel.kitChannelId || channel.id,
        channelLabel: getChannelLabel(channel),
        layerId: layer.id,
        layerIndex,
        layerCount: channel.velocityLayers.length,
        minVelocity: range.minVelocity,
        maxVelocity: range.maxVelocity,
      }];
    })
  ));
};

export const getSampleUsageLabels = (
  sampleReference: string,
  channels: readonly SampleUsageChannel[],
): string[] => getSampleUsages(sampleReference, channels).map(usage => (
  usage.layerCount > 1
    ? `${usage.channelLabel} · Layer ${usage.layerIndex + 1} · `
      + `${usage.minVelocity}-${usage.maxVelocity}`
    : `${usage.channelLabel} · ${usage.minVelocity}-${usage.maxVelocity}`
));

export const isSampleInUse = (
  sampleReference: string,
  channels: readonly SampleUsageChannel[],
): boolean => getSampleUsages(sampleReference, channels).length > 0;
