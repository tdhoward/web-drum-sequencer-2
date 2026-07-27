import {
  calculateKitContentHash,
  type SampleFingerprint,
} from '../common/contentHash';
import {
  createSamplesState,
  createKitsState,
  normalizeKitChannelsState,
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
  const sampleState = createSamplesState(preset.channels);
  const channels = normalizeKitChannelsState(preset.channels, kitId, sampleState);
  const kit = createKitsState(preset.channels, kitId, '').entities[kitId];
  const samples: Record<string, Sample> = {};
  const sampleFingerprints: Record<string, SampleFingerprint> = {};

  for (const sampleId of sampleState.ids) {
    const sampleMetadata = sampleState.entities[sampleId];
    const sampleURL = sampleMetadata.url;
    if (!sampleURL) {
      throw new Error(`Kit sample ${sampleId} has no sample URL`);
    }
    const fingerprint = await ensureSampleFingerprint(sampleURL);
    sampleFingerprints[sampleURL] = fingerprint;
    samples[sampleId] = {
      ...sampleMetadata,
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
