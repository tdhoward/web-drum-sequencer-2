import {
  PERCUSSION_TYPES,
  resolveKitChannelMapping,
} from './percussion';

describe('resolveKitChannelMapping', () => {
  const sourceKitChannels = [
    {
      id: 'tr808-bd-short',
      laneId: 'tr808-bd-short',
      name: 'BD Short',
      percussionType: PERCUSSION_TYPES.BASS_DRUM,
      articulation: 'short',
      register: 'low',
    },
    {
      id: 'tr808-rimshot',
      laneId: 'tr808-rimshot',
      name: 'Rimshot',
      percussionType: PERCUSSION_TYPES.RIMSHOT,
    },
    {
      id: 'tr808-cym',
      laneId: 'tr808-cym',
      name: 'Cymbal',
      percussionType: PERCUSSION_TYPES.CYMBAL,
    },
  ];

  test('maps lanes by source metadata to target kit channels', () => {
    const result = resolveKitChannelMapping({
      patternLanes: ['tr808-bd-short'],
      sourceKitChannels,
      targetKitChannels: [
        {
          id: 'djembe-boom',
          name: 'Djembe Boom',
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
          register: 'low',
        },
      ],
    });

    expect(result.unresolved).toEqual([]);
    expect(result.mappings[0]).toEqual(expect.objectContaining({
      laneId: 'tr808-bd-short',
      targetKitChannelId: 'djembe-boom',
      confidence: 'high',
      reason: 'exact percussionType and register match',
    }));
  });

  test('falls back to compatible percussion types with low confidence', () => {
    const result = resolveKitChannelMapping({
      patternLanes: ['tr808-rimshot'],
      sourceKitChannels,
      targetKitChannels: [
        {
          id: 'djembe-slap',
          name: 'Djembe Slap',
          percussionType: PERCUSSION_TYPES.SNARE_DRUM,
        },
      ],
    });

    expect(result.unresolved).toEqual([]);
    expect(result.mappings[0]).toEqual(expect.objectContaining({
      laneId: 'tr808-rimshot',
      targetKitChannelId: 'djembe-slap',
      confidence: 'low',
    }));
  });

  test('reports unresolved lanes when no candidate matches', () => {
    const result = resolveKitChannelMapping({
      patternLanes: ['tr808-cym'],
      sourceKitChannels,
      targetKitChannels: [
        {
          id: 'djembe-boom',
          name: 'Djembe Boom',
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
        },
      ],
    });

    expect(result.mappings).toEqual([]);
    expect(result.unresolved[0]).toEqual(expect.objectContaining({
      laneId: 'tr808-cym',
      reason: 'no target kit channel matched this lane',
    }));
  });
});
