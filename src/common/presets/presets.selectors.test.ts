import { normalizeKitPresetState } from './presets.selectors';

describe('Kit preset velocity-layer serialization', () => {
  test('round-trips every layer sample reference and setting', () => {
    const normalized = normalizeKitPresetState({
      channels: [{
        id: 'snare',
        velocityLayers: [
          {
            id: 'snare:soft',
            sample: 'soft.wav',
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
            sample: 'hard.wav',
            maxVelocity: 127,
            alignmentOffset: 0.03,
            trimDb: -1,
          },
        ],
      }],
    });

    expect(normalized?.channels[0].velocityLayers).toEqual([
      expect.objectContaining({
        sample: 'soft.wav',
        sampleId: 'sample:soft.wav',
        maxVelocity: 55,
        alignmentOffset: 0.01,
        trimDb: -3,
      }),
      expect.objectContaining({
        sample: 'medium.wav',
        sampleId: 'sample:medium.wav',
        maxVelocity: 100,
        alignmentOffset: 0.02,
        trimDb: 0,
      }),
      expect.objectContaining({
        sample: 'hard.wav',
        sampleId: 'sample:hard.wav',
        maxVelocity: 127,
        alignmentOffset: 0.03,
        trimDb: -1,
      }),
    ]);
    expect(normalized?.channels[0]).not.toHaveProperty('sample');
    expect(normalized?.channels[0]).not.toHaveProperty('alignmentOffset');
  });
});
