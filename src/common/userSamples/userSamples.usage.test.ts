import { normalizeKitChannelsState } from '../sequencerModel';
import type { UserPreset } from '../presets/presets.reducer';
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

  test('reports saved Kits separately, including every non-reference layer and range', () => {
    const savedKits: UserPreset[] = [
      {
        name: 'Studio Kit',
        channels: [{
          id: 'snare',
          name: 'Studio Snare',
          velocityLayers: [
            { id: 'soft', sample: 'shared.wav', maxVelocity: 40 },
            { id: 'main', sample: 'main.wav', maxVelocity: 100 },
            { id: 'hard', sampleId: 'sample:shared.wav', maxVelocity: 127 },
          ],
        }],
      },
      {
        name: 'Live Kit',
        channels: [{
          id: 'snare',
          name: 'Live Snare',
          velocityLayers: [{ sampleId: 'sample:shared.wav', maxVelocity: 127 }],
        }],
      },
      { name: 'No Channels' },
    ];

    expect(getSampleUsageLabels('shared.wav', createChannels(), savedKits)).toEqual([
      ...getSampleUsageLabels('shared.wav', createChannels()),
      'Saved Kit "Studio Kit" · Studio Snare · Layer 1 · 1-40',
      'Saved Kit "Studio Kit" · Studio Snare · Layer 3 · 101-127',
      'Saved Kit "Live Kit" · Live Snare · 1-127',
    ]);
    expect(getSampleUsages('sample:shared.wav', [], savedKits)).toEqual([
      expect.objectContaining({ savedKitName: 'Studio Kit', layerId: 'soft' }),
      expect.objectContaining({ savedKitName: 'Studio Kit', layerId: 'hard' }),
      expect.objectContaining({ savedKitName: 'Live Kit' }),
    ]);
    expect(isSampleInUse('shared.wav', [], savedKits)).toBe(true);
    expect(isSampleInUse('unused.wav', [], savedKits)).toBe(false);
  });
});
