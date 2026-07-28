import {
  KIT_BUNDLE_FORMAT,
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
    alignmentOffset: 0.01,
    percussionType: 'bass_drum',
    gain: 0.9,
  }], 'kit-1');
  const channel = channelsState.entities.kick;
  const kit: Kit = { id: 'kit-1', name: 'Test Kit', channelIds: ['kick'] };
  const sample: Sample = {
    id: channel.velocityLayers[0].sampleId,
    name: 'Kick',
    url: 'kick.wav',
    sourceType: 'user',
  };
  return createKitExportBundle({
    kit,
    channels: [channel],
    samples: { [sample.id]: sample },
    getSampleBytes: async () => Uint8Array.from([10, 20, 30, 40]).buffer,
  });
};

const createLayeredBundle = async () => {
  const channelsState = normalizeKitChannelsState([{
    id: 'snare',
    name: 'Snare',
    percussionType: 'snare_drum',
    velocityLayers: [
      {
        id: 'snare:soft',
        sample: 'shared.wav',
        maxVelocity: 55,
        alignmentOffset: 0.01,
        trimDb: -3,
      },
      {
        id: 'snare:medium',
        sample: 'medium.wav',
        maxVelocity: 100,
        alignmentOffset: 0.02,
        trimDb: 0,
      },
      {
        id: 'snare:hard',
        sample: 'shared.wav',
        maxVelocity: 127,
        alignmentOffset: 0.03,
        trimDb: -1.5,
      },
    ],
  }], 'kit-layered');
  const channel = channelsState.entities.snare;
  const kit: Kit = {
    id: 'kit-layered',
    name: 'Layered Kit',
    channelIds: [channel.id],
  };
  const samples = channel.velocityLayers.reduce<Record<string, Sample>>((result, layer) => {
    const url = layer.sampleId.replace(/^sample:/, '');
    result[layer.sampleId] = {
      id: layer.sampleId,
      name: url,
      url,
      sourceType: 'user',
    };
    return result;
  }, {});

  return createKitExportBundle({
    kit,
    channels: [channel],
    samples,
    getSampleBytes: async sample => (
      Uint8Array.from(sample.url === 'shared.wav' ? [1, 2, 3] : [4, 5, 6]).buffer
    ),
  });
};

describe('kit export bundles', () => {
  test('round-trips a self-contained kit file and verifies its hash chain', async () => {
    const bundle = await createBundle();
    const parsed = parseKitExportBundle(serializeKitExportBundle(bundle));
    const verified = await verifyKitExportBundle(parsed);

    expect(bundle.manifest.version).toBe(2);
    expect(bundle.manifest.drumkit.channels[0].velocityLayers).toEqual([
      expect.objectContaining({
        sampleId: 'sample:kick.wav',
        maxVelocity: 127,
        alignmentOffset: 0.01,
        trimDb: 0,
      }),
    ]);
    expect(bundle.manifest.drumkit.channels[0]).not.toHaveProperty('sampleId');
    expect(bundle.manifest.drumkit.samples[0]).not.toHaveProperty('alignmentOffset');
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

  test('round-trips all layers and emits one payload for a shared sample', async () => {
    const bundle = await createLayeredBundle();
    const restored = parseKitExportBundle(serializeKitExportBundle(bundle));

    expect(restored.manifest.drumkit.channels[0].velocityLayers).toEqual([
      expect.objectContaining({
        sampleId: 'sample:shared.wav',
        maxVelocity: 55,
        alignmentOffset: 0.01,
        trimDb: -3,
      }),
      expect.objectContaining({
        sampleId: 'sample:medium.wav',
        maxVelocity: 100,
        alignmentOffset: 0.02,
        trimDb: 0,
      }),
      expect.objectContaining({
        sampleId: 'sample:shared.wav',
        maxVelocity: 127,
        alignmentOffset: 0.03,
        trimDb: -1.5,
      }),
    ]);
    expect(restored.manifest.drumkit.samples).toHaveLength(2);
    expect(Object.keys(restored.samplePayloads)).toHaveLength(2);
    await expect(verifyKitExportBundle(restored)).resolves.toEqual(expect.objectContaining({
      kitHash: expect.objectContaining({ contentHashVersion: 2 }),
    }));
  });

  test('rejects malformed v2 velocity ranges', async () => {
    const bundle = await createLayeredBundle();
    bundle.manifest.drumkit.channels[0].velocityLayers![0].maxVelocity = 127;

    await expect(verifyKitExportBundle(bundle)).rejects.toThrow(
      'Kit bundle manifest is invalid',
    );
  });

  test('rejects unsupported and malformed files', async () => {
    expect(() => parseKitExportBundle('not-json')).toThrow('not valid JSON');
    expect(() => parseKitExportBundle(JSON.stringify({
      manifest: { format: 'unknown', version: 1 },
      samplePayloads: {},
    }))).toThrow('Unsupported kit bundle');
    expect(() => parseKitExportBundle(JSON.stringify({
      manifest: { format: KIT_BUNDLE_FORMAT, version: 1 },
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
