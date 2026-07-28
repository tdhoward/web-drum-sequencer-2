import type { PatternPack } from '../sequencerModel';
import {
  PATTERN_PACK_BUNDLE_FORMAT,
  createPatternPackExportBundle,
  parsePatternPackExportBundle,
  serializePatternPackExportBundle,
  verifyPatternPackExportBundle,
} from './patternPackBundles';

const patternPack: PatternPack = {
  id: 'travel-beats',
  name: 'Travel Beats',
  bpm: 108,
  swing: 0.2,
  patternNames: ['Main'],
  patternSettings: [{
    timeSignature: { beatsPerBar: 4, beatUnit: 4 },
    bars: 1,
    stepsPerBeat: 4,
  }],
  lanes: [{
    id: 'kick',
    laneId: 'kick',
    name: 'Kick',
    percussionType: 'bass_drum',
  }],
  notes: {
    kick: [[
      { id: 'kick-1', beat: 1, velocity: 80 },
      { id: 'hidden-kick', beat: 5 },
    ]],
  },
};

describe('pattern pack export bundles', () => {
  test('round-trips a pattern pack and verifies its content hash', async () => {
    const bundle = await createPatternPackExportBundle(patternPack);
    const parsed = parsePatternPackExportBundle(serializePatternPackExportBundle(bundle));
    const verified = await verifyPatternPackExportBundle(parsed);

    expect(parsed.manifest.patternPack).toEqual(bundle.manifest.patternPack);
    expect(parsed.manifest.patternPack.notes.kick[0]).toHaveLength(1);
    expect(parsed.manifest.patternPack.notes.kick[0][0].id).toBeUndefined();
    expect(parsed.manifest.version).toBe(2);
    expect(verified.contentHash).toBe(bundle.manifest.patternPack.contentHash);
    expect(verified.contentHashVersion).toBe(2);
  });

  test('exports only lanes represented by the selected kit', async () => {
    const bundle = await createPatternPackExportBundle({
      ...patternPack,
      lanes: [
        ...patternPack.lanes,
        {
          id: 'orphan',
          laneId: 'orphan',
          name: 'Orphan Lane',
          percussionType: 'clap',
        },
      ],
      notes: {
        ...patternPack.notes,
        orphan: [[{ id: 'orphan-note', beat: 1 }]],
      },
    }, ['kick']);

    expect(bundle.manifest.patternPack.lanes.map(lane => lane.laneId)).toEqual(['kick']);
    expect(bundle.manifest.patternPack.notes.orphan).toBeUndefined();
  });

  test('rejects pattern content changed after export', async () => {
    const bundle = await createPatternPackExportBundle(patternPack);
    bundle.manifest.patternPack.notes.kick[0][0].velocity = 32;

    await expect(verifyPatternPackExportBundle(bundle)).rejects.toThrow(
      'content hash verification failed',
    );
  });

  test('rejects unsupported and malformed files', () => {
    expect(() => parsePatternPackExportBundle('not-json')).toThrow('not valid JSON');
    expect(() => parsePatternPackExportBundle(JSON.stringify({
      manifest: { format: 'unknown', version: 1 },
    }))).toThrow('Unsupported pattern pack bundle');
    expect(() => parsePatternPackExportBundle(JSON.stringify({
      manifest: {
        format: PATTERN_PACK_BUNDLE_FORMAT,
        version: 1,
      },
    }))).toThrow('Unsupported pattern pack bundle');
    expect(() => parsePatternPackExportBundle(JSON.stringify({
      manifest: {
        format: PATTERN_PACK_BUNDLE_FORMAT,
        version: 2,
        patternPack: { id: 'broken' },
      },
    }))).toThrow('manifest is invalid');
  });

  test('omits current default velocity while retaining non-default integers', async () => {
    const bundle = await createPatternPackExportBundle({
      ...patternPack,
      notes: {
        kick: [[
          { beat: 1, velocity: 64 },
          { beat: 2, velocity: 80 },
        ]],
      },
    });

    expect(bundle.manifest.patternPack.notes.kick[0]).toEqual([
      { beat: 1 },
      { beat: 2, velocity: 80 },
    ]);
  });

  test('rejects multiplier velocities in v2 manifests', () => {
    expect(() => parsePatternPackExportBundle(JSON.stringify({
      manifest: {
        format: PATTERN_PACK_BUNDLE_FORMAT,
        version: 2,
        patternPack: {
          ...patternPack,
          notes: { kick: [[{ beat: 1, velocity: 1.25 }]] },
          contentHashAlgorithm: 'sha256',
          contentHashVersion: 2,
          contentHash: 'a'.repeat(64),
        },
      },
    }))).toThrow('manifest is invalid');
  });
});
