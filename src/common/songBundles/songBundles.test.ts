import {
  createSongExportBundle,
  resolveSongBundleImport,
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
