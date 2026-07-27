import presets from '../presets';
import { normalizeKitChannelsState } from './sequencerModel';
import { validateVelocityLayers } from './velocityLayers';

describe('factory preset velocity layers', () => {
  test.each(presets.map(preset => [preset.name, preset] as const))(
    'normalizes every channel in %s to a valid single-layer partition',
    (_name, preset) => {
      const channels = normalizeKitChannelsState(preset.channels);

      channels.ids.forEach((channelId) => {
        const channel = channels.entities[channelId];
        expect(channel.velocityLayers).toHaveLength(1);
        expect(validateVelocityLayers(channel.velocityLayers)).toEqual([]);
        expect(channel).not.toHaveProperty('sample');
        expect(channel).not.toHaveProperty('sampleId');
        expect(channel).not.toHaveProperty('alignmentOffset');
      });
    },
  );
});
