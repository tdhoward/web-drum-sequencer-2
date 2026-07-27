import { normalizeKitChannelsState } from '../sequencerModel';
import {
  getSampleUsageLabels,
  getSampleUsages,
  isSampleInUse,
} from './userSamples.usage';

describe('user sample velocity-layer usage', () => {
  const createChannels = () => {
    const state = normalizeKitChannelsState([
      {
        id: 'snare',
        name: 'Layered Snare',
        velocityLayers: [
          {
            id: 'snare:soft',
            sample: 'shared.wav',
            maxVelocity: 55,
          },
          {
            id: 'snare:medium',
            sample: 'medium.wav',
            maxVelocity: 100,
          },
          {
            id: 'snare:hard',
            sample: 'shared.wav',
            maxVelocity: 127,
          },
        ],
      },
      {
        id: 'kick',
        name: 'Kick',
        sample: 'shared.wav',
      },
    ]);

    return state.ids.map(id => state.entities[id]);
  };

  test('reports every matching layer with its channel and inclusive range', () => {
    expect(getSampleUsageLabels('shared.wav', createChannels())).toEqual([
      'Layered Snare · Layer 1 · 1-55',
      'Layered Snare · Layer 3 · 101-127',
      'Kick · 1-127',
    ]);
  });

  test('finds normalized sample ids used only by a non-reference layer', () => {
    const usages = getSampleUsages('sample:shared.wav', createChannels());

    expect(usages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        channelId: 'snare',
        layerId: 'snare:hard',
        minVelocity: 101,
        maxVelocity: 127,
      }),
    ]));
    expect(isSampleInUse('shared.wav', createChannels())).toBe(true);
    expect(isSampleInUse('unused.wav', createChannels())).toBe(false);
  });
});
