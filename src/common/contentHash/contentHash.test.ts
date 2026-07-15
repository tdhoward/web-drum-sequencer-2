import {
  calculateKitContentHash,
  calculatePatternPackContentHash,
  calculateSampleFingerprint,
  calculateSongContentHash,
  canonicalStringify,
} from './contentHash';
import { normalizeKitChannelsState } from '../sequencerModel';
import type {
  Kit,
  PatternPack,
  Sample,
  SavedSong,
} from '../sequencerModel';

const hash = 'a'.repeat(64);

const patternPack = (): PatternPack => ({
  id: 'pack-a',
  name: 'First name',
  bpm: 120,
  swing: 0.1,
  lanes: [{
    id: 'kick-a',
    laneId: 'kick-a',
    name: 'Kick',
    percussionType: 'bass_drum',
    tags: ['low', 'drum'],
  }],
  notes: {
    'kick-a': [[
      { id: 'note-a', beat: 2, velocity: 0.75 },
      { id: 'note-b', beat: 1 },
    ]],
  },
});

describe('canonical content hashes', () => {
  test('canonical JSON is independent of object key order and normalizes negative zero', () => {
    expect(canonicalStringify({ z: -0, a: { d: 2, c: 1 }, omitted: undefined })).toBe(
      '{"a":{"c":1,"d":2},"z":0}',
    );
  });

  test('sample fingerprint hashes all raw bytes and records byte length', async () => {
    const first = await calculateSampleFingerprint(Uint8Array.from([1, 2, 3]));
    const same = await calculateSampleFingerprint(Uint8Array.from([1, 2, 3]));
    const different = await calculateSampleFingerprint(Uint8Array.from([1, 2, 4]));

    expect(first).toEqual(same);
    expect(first.byteLength).toBe(3);
    expect(first.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(different.contentHash).not.toBe(first.contentHash);
  });

  test('pattern-pack hashes ignore names and local IDs', async () => {
    const first = patternPack();
    const renamed: PatternPack = {
      ...first,
      id: 'imported-pack-id',
      name: 'Renamed pack',
      lanes: [{
        ...first.lanes[0],
        id: 'imported-kick',
        laneId: 'imported-kick',
        name: 'Renamed lane',
        tags: ['drum', 'low'],
      }],
      notes: {
        'imported-kick': [[
          { id: 'new-note-2', beat: 1 },
          { id: 'new-note-1', beat: 2, velocity: 0.75 },
        ]],
      },
    };

    expect(await calculatePatternPackContentHash(renamed)).toEqual(
      await calculatePatternPackContentHash(first),
    );
  });

  test('kit hashes use sample content rather than sample and channel IDs', async () => {
    const firstChannels = normalizeKitChannelsState([{
      id: 'kick-a',
      sample: 'first-name.wav',
      gain: 0.8,
      percussionType: 'bass_drum',
    }], 'kit-a');
    const secondChannels = normalizeKitChannelsState([{
      id: 'kick-b',
      sample: 'renamed.wav',
      gain: 0.8,
      percussionType: 'bass_drum',
    }], 'kit-b');
    const firstKit: Kit = { id: 'kit-a', name: 'First', channelIds: ['kick-a'] };
    const secondKit: Kit = { id: 'kit-b', name: 'Renamed', channelIds: ['kick-b'] };
    const firstSample: Sample = {
      id: firstChannels.entities['kick-a'].sampleId,
      sourceType: 'user',
      name: 'First sample',
      contentHash: hash,
      contentHashAlgorithm: 'sha256',
      contentHashVersion: 1,
      alignmentOffset: 0.01,
    };
    const secondSample: Sample = {
      ...firstSample,
      id: secondChannels.entities['kick-b'].sampleId,
      name: 'Renamed sample',
      url: 'somewhere-else.wav',
    };

    const firstHash = await calculateKitContentHash({
      kit: firstKit,
      channels: [firstChannels.entities['kick-a']],
      samples: { [firstSample.id]: firstSample },
    });
    const secondHash = await calculateKitContentHash({
      kit: secondKit,
      channels: [secondChannels.entities['kick-b']],
      samples: { [secondSample.id]: secondSample },
    });

    expect(secondHash).toEqual(firstHash);
  });

  test('song hashes include both dependency hashes', async () => {
    const pack = patternPack();
    const song: SavedSong = {
      id: 'song-a',
      name: 'Song',
      selectedKitId: 'kit-a',
      patternPackId: pack.id,
      arrangementPatternIds: [['pattern-0']],
      tempoChanges: [120],
    };
    const input = {
      song,
      kitContentHash: '1'.repeat(64),
      patternPack: pack,
      patternPackContentHash: '2'.repeat(64),
    };
    const first = await calculateSongContentHash(input);
    const differentKit = await calculateSongContentHash({
      ...input,
      kitContentHash: '3'.repeat(64),
    });
    const differentPack = await calculateSongContentHash({
      ...input,
      patternPackContentHash: '4'.repeat(64),
    });

    expect(differentKit.contentHash).not.toBe(first.contentHash);
    expect(differentPack.contentHash).not.toBe(first.contentHash);
  });
});
