import { ensureSampleFingerprint } from './sampleStore';
import { calculateKitPresetContentHash } from './libraryContentHash';

jest.mock('./sampleStore', () => ({
  ensureSampleFingerprint: jest.fn(async (sampleUrl: string) => ({
    contentHashAlgorithm: 'sha256',
    contentHashVersion: 1,
    contentHash: sampleUrl === 'shared.wav' ? '1'.repeat(64) : '2'.repeat(64),
    byteLength: 3,
  })),
}));

describe('Kit preset content hashing', () => {
  beforeEach(() => jest.clearAllMocks());

  const preset = {
    channels: [{
      id: 'snare',
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
          trimDb: -1,
        },
      ],
    }],
  };

  test('fingerprints every unique layer sample and produces a v2 Kit hash', async () => {
    const result = await calculateKitPresetContentHash(preset);

    expect(ensureSampleFingerprint).toHaveBeenCalledTimes(2);
    expect(ensureSampleFingerprint).toHaveBeenCalledWith('shared.wav');
    expect(ensureSampleFingerprint).toHaveBeenCalledWith('medium.wav');
    expect(result.hash.contentHashVersion).toBe(2);
  });

  test('changes when a non-reference layer changes', async () => {
    const original = await calculateKitPresetContentHash(preset);
    const changed = await calculateKitPresetContentHash({
      channels: [{
        ...preset.channels[0],
        velocityLayers: preset.channels[0].velocityLayers.map((layer, index) => (
          index === 2 ? { ...layer, trimDb: -2 } : layer
        )),
      }],
    });

    expect(changed.hash.contentHash).not.toBe(original.hash.contentHash);
  });
});
