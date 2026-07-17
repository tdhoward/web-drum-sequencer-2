import {
  createSongExportBundle,
  parseSongExportBundle,
  resolveSongBundleImport,
  serializeSongExportBundle,
  verifySongExportBundle,
} from './songBundles';
import { normalizeKitChannelsState } from '../sequencerModel';
import type { Kit, PatternPack, Sample, SavedSong } from '../sequencerModel';

const createBundle = async () => {
  const channelsState = normalizeKitChannelsState([{
    id: 'kick',
    sample: 'kick.wav',
    percussionType: 'bass_drum',
    gain: 1,
  }], 'kit-1');
  const channel = channelsState.entities.kick;
  const kit: Kit = { id: 'kit-1', name: 'Kit', channelIds: ['kick'] };
  const sample: Sample = {
    id: channel.sampleId,
    name: 'Kick',
    url: 'kick.wav',
    sourceType: 'user',
  };
  const patternPack: PatternPack = {
    id: 'pack-1',
    name: 'Pack',
    bpm: 100,
    swing: 0,
    lanes: [{ id: 'kick', laneId: 'kick', percussionType: 'bass_drum' }],
    notes: { kick: [[{ id: 'note-1', beat: 1 }]] },
  };
  const song: SavedSong = {
    id: 'song-1',
    name: 'Song',
    selectedKitId: kit.id,
    patternPackId: patternPack.id,
    arrangementPatternIds: [['pattern-0']],
    tempoChanges: [100],
  };

  return createSongExportBundle({
    song,
    kit,
    channels: [channel],
    samples: { [sample.id]: sample },
    patternPack,
    getSampleBytes: async () => Uint8Array.from([10, 20, 30]).buffer,
  });
};

describe('song export bundles', () => {
  test('creates and verifies a complete content-hash dependency chain', async () => {
    const bundle = await createBundle();
    const verified = await verifySongExportBundle(bundle);

    expect(verified.kitHash.contentHash).toBe(bundle.manifest.drumkit.kit.contentHash);
    expect(verified.patternPackHash.contentHash).toBe(bundle.manifest.patternPack.contentHash);
    expect(verified.songHash.contentHash).toBe(bundle.manifest.song.contentHash);
    expect(bundle.manifest.song.kitContentHash).toBe(verified.kitHash.contentHash);
  });

  test('serializes and restores embedded sample payloads', async () => {
    const bundle = await createBundle();
    const restored = parseSongExportBundle(serializeSongExportBundle(bundle));

    await expect(verifySongExportBundle(restored)).resolves.toEqual(expect.objectContaining({
      songHash: expect.objectContaining({ contentHash: bundle.manifest.song.contentHash }),
    }));
    expect(Array.from(new Uint8Array(Object.values(restored.samplePayloads)[0])))
      .toEqual([10, 20, 30]);
  });

  test('rejects malformed serialized manifests', async () => {
    expect(() => parseSongExportBundle('{"manifest":{}}')).toThrow(
      'Unsupported song bundle format or version',
    );
  });

  test('exports only represented lanes and active notes without note IDs', async () => {
    const source = await createBundle();
    const channel = source.manifest.drumkit.channels[0];
    const sample = source.manifest.drumkit.samples[0];
    const patternPack: PatternPack = {
      ...source.manifest.patternPack,
      patternSettings: [{
        timeSignature: { beatsPerBar: 4, beatUnit: 4 },
        bars: 1,
        stepsPerBeat: 4,
      }],
      lanes: [
        ...source.manifest.patternPack.lanes,
        { id: 'orphan', laneId: 'orphan', percussionType: 'snare_drum' },
      ],
      notes: {
        kick: [[
          { id: 'portable-id', beat: 1 },
          { id: 'hidden-id', beat: 5 },
        ]],
        orphan: [[{ id: 'orphan-id', beat: 1 }]],
      },
    };
    const bundle = await createSongExportBundle({
      song: source.manifest.song,
      kit: source.manifest.drumkit.kit,
      channels: [channel],
      samples: { [sample.id]: sample },
      patternPack,
      includedLaneIds: ['kick'],
      getSampleBytes: async () => Uint8Array.from([10, 20, 30]).buffer,
    });

    expect(bundle.manifest.patternPack.lanes.map(lane => lane.laneId)).toEqual(['kick']);
    expect(bundle.manifest.patternPack.notes.orphan).toBeUndefined();
    expect(bundle.manifest.patternPack.notes.kick[0]).toEqual([{ beat: 1 }]);
  });

  test('rejects a sample payload changed after export', async () => {
    const bundle = await createBundle();
    const [payloadKey] = Object.keys(bundle.samplePayloads);
    bundle.samplePayloads[payloadKey] = Uint8Array.from([10, 20, 31]).buffer;

    await expect(verifySongExportBundle(bundle)).rejects.toThrow(
      'content hash verification failed',
    );
  });

  test('resolves duplicate dependencies by musical-content hash', async () => {
    const bundle = await createBundle();
    const resolution = await resolveSongBundleImport(bundle, {
      kits: [{
        ...bundle.manifest.drumkit.kit,
        id: 'existing-kit',
        name: 'Locally renamed kit',
      }],
      patternPacks: [{
        ...bundle.manifest.patternPack,
        id: 'existing-pack',
        name: 'Locally renamed pack',
      }],
      songs: [],
    });

    expect(resolution.selectedKitId).toBe('existing-kit');
    expect(resolution.patternPackId).toBe('existing-pack');
    expect(resolution.resolvedSong).toEqual(expect.objectContaining({
      selectedKitId: 'existing-kit',
      patternPackId: 'existing-pack',
    }));
  });
});
