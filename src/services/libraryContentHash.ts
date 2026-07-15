import {
  calculateKitContentHash,
  type SampleFingerprint,
} from '../common/contentHash';
import {
  createKitsState,
  normalizeKitChannelsState,
  sampleIdFromUrl,
} from '../common/sequencerModel';
import type {
  ContentHashMetadata,
  KitChannelInput,
  Sample,
} from '../common/sequencerModel';
import { ensureSampleFingerprint } from './sampleStore';

export type KitPresetHashInput = {
  channels: KitChannelInput[];
};

export type KitPresetHashResult = {
  hash: ContentHashMetadata;
  sampleFingerprints: Record<string, SampleFingerprint>;
};

export const calculateKitPresetContentHash = async (
  preset: KitPresetHashInput,
): Promise<KitPresetHashResult> => {
  const kitId = 'content-hash-kit';
  const channels = normalizeKitChannelsState(preset.channels, kitId);
  const kit = createKitsState(preset.channels, kitId, '').entities[kitId];
  const samples: Record<string, Sample> = {};
  const sampleFingerprints: Record<string, SampleFingerprint> = {};

  for (const channelId of channels.ids) {
    const channel = channels.entities[channelId];
    const sampleURL = typeof channel.sample === 'string' ? channel.sample : undefined;
    if (!sampleURL) {
      throw new Error(`Kit channel ${channel.id} has no sample URL`);
    }
    const fingerprint = await ensureSampleFingerprint(sampleURL);
    sampleFingerprints[sampleURL] = fingerprint;
    const sampleId = channel.sampleId || sampleIdFromUrl(sampleURL);
    samples[sampleId] = {
      id: sampleId,
      sourceType: channel.sourceType || 'user',
      alignmentOffset: typeof channel.alignmentOffset === 'number'
        ? Math.max(0, channel.alignmentOffset)
        : 0,
      ...fingerprint,
    };
  }

  return {
    hash: await calculateKitContentHash({
      kit,
      channels: channels.ids.map(id => channels.entities[id]),
      samples,
    }),
    sampleFingerprints,
  };
};
