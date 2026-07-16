import type { PatternPack } from '../sequencerModel';
import {
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
    kick: [[{ id: 'kick-1', beat: 1, velocity: 1.2 }]],
  },
};

describe('pattern pack export bundles', () => {
  test('round-trips a pattern pack and verifies its content hash', async () => {
    const bundle = await createPatternPackExportBundle(patternPack);
    const parsed = parsePatternPackExportBundle(serializePatternPackExportBundle(bundle));
    const verified = await verifyPatternPackExportBundle(parsed);

    expect(parsed.manifest.patternPack).toEqual(bundle.manifest.patternPack);
    expect(parsed.manifest.patternPack.notes.kick[0][0].id).toBeUndefined();
    expect(verified.contentHash).toBe(bundle.manifest.patternPack.contentHash);
  });

  test('rejects pattern content changed after export', async () => {
    const bundle = await createPatternPackExportBundle(patternPack);
    bundle.manifest.patternPack.notes.kick[0][0].velocity = 0.5;

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
        format: 'wds-pattern-pack-bundle',
        version: 1,
        patternPack: { id: 'broken' },
      },
    }))).toThrow('manifest is invalid');
  });
});
