import {
  createKitExportBundle,
  parseKitExportBundle,
  resolveKitBundleImport,
  serializeKitExportBundle,
  verifyKitExportBundle,
} from './kitBundles';
import { normalizeKitChannelsState } from '../sequencerModel';
import type { Kit, Sample } from '../sequencerModel';

const createBundle = async () => {
  const channelsState = normalizeKitChannelsState([{
    id: 'kick',
    name: 'Kick',
    sample: 'kick.wav',
    percussionType: 'bass_drum',
    gain: 0.9,
  }], 'kit-1');
  const channel = channelsState.entities.kick;
  const kit: Kit = { id: 'kit-1', name: 'Test Kit', channelIds: ['kick'] };
  const sample: Sample = {
    id: channel.sampleId,
    name: 'Kick',
    url: 'kick.wav',
    sourceType: 'user',
    alignmentOffset: 0.01,
  };
  return createKitExportBundle({
    kit,
    channels: [channel],
    samples: { [sample.id]: sample },
    getSampleBytes: async () => Uint8Array.from([10, 20, 30, 40]).buffer,
  });
};

describe('kit export bundles', () => {
  test('round-trips a self-contained kit file and verifies its hash chain', async () => {
    const bundle = await createBundle();
    const parsed = parseKitExportBundle(serializeKitExportBundle(bundle));
    const verified = await verifyKitExportBundle(parsed);

    expect(verified.kitHash.contentHash).toBe(bundle.manifest.drumkit.kit.contentHash);
    expect(new Uint8Array(Object.values(parsed.samplePayloads)[0])).toEqual(
      Uint8Array.from([10, 20, 30, 40]),
    );
  });

  test('rejects a sample payload changed after export', async () => {
    const bundle = await createBundle();
    const [payloadKey] = Object.keys(bundle.samplePayloads);
    bundle.samplePayloads[payloadKey] = Uint8Array.from([10, 20, 30, 41]).buffer;

    await expect(verifyKitExportBundle(bundle)).rejects.toThrow(
      'content hash verification failed',
    );
  });

  test('rejects unsupported and malformed files', async () => {
    expect(() => parseKitExportBundle('not-json')).toThrow('not valid JSON');
    expect(() => parseKitExportBundle(JSON.stringify({
      manifest: { format: 'unknown', version: 1 },
      samplePayloads: {},
    }))).toThrow('Unsupported kit bundle');
  });

  test('resolves an existing kit by musical-content hash', async () => {
    const bundle = await createBundle();
    const existingKit = {
      ...bundle.manifest.drumkit.kit,
      id: 'local-kit',
      name: 'Locally Renamed Kit',
    };
    const resolution = await resolveKitBundleImport(bundle, [existingKit]);

    expect(resolution.duplicateKit).toBe(existingKit);
    expect(resolution.resolvedKitId).toBe('local-kit');
  });
});
