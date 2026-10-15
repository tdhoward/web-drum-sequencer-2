import {
  getVelocityLayerRange,
  normalizeVelocityLayers,
  sampleIdFromUrl,
  type VelocityLayer,
} from '../velocityLayers';
import type { UserPreset } from '../presets/presets.reducer';

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
  savedKitName?: string;
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

const getChannelSampleUsages = (
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

export const getSampleUsages = (
  sampleReference: string,
  channels: readonly SampleUsageChannel[],
  savedKits: readonly UserPreset[] = [],
): SampleUsage[] => [
  ...getChannelSampleUsages(sampleReference, channels),
  ...savedKits.flatMap((kit) => {
    const savedChannels = (kit.channels || []).map(channel => ({
      ...channel,
      velocityLayers: normalizeVelocityLayers(channel),
    }));
    return getChannelSampleUsages(sampleReference, savedChannels).map(usage => ({
      ...usage,
      savedKitName: kit.name,
    }));
  }),
];

export const getSampleUsageLabels = (
  sampleReference: string,
  channels: readonly SampleUsageChannel[],
  savedKits: readonly UserPreset[] = [],
): string[] => getSampleUsages(sampleReference, channels, savedKits).map((usage) => {
  const layerLabel = usage.layerCount > 1
    ? `${usage.channelLabel} · Layer ${usage.layerIndex + 1} · `
      + `${usage.minVelocity}-${usage.maxVelocity}`
    : `${usage.channelLabel} · ${usage.minVelocity}-${usage.maxVelocity}`;
  return usage.savedKitName !== undefined
    ? `Saved Kit "${usage.savedKitName}" · ${layerLabel}`
    : layerLabel;
});

export const isSampleInUse = (
  sampleReference: string,
  channels: readonly SampleUsageChannel[],
  savedKits: readonly UserPreset[] = [],
): boolean => getSampleUsages(sampleReference, channels, savedKits).length > 0;
