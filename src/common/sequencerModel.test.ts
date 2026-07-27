import {
  beatToStep,
  createPatternsState,
  createSamplesState,
  DEFAULT_KIT_ID,
  DEFAULT_NOTE_VELOCITY,
  MAX_NOTE_VELOCITY,
  MIN_NOTE_VELOCITY,
  migrateToKitSequencerState,
  migrateToMidiVelocitySequencerState,
  migrateToNormalizedSequencerState,
  migrateToVelocityLayerSequencerState,
  normalizeArrangementPatternIds,
  normalizeChannelsState,
  normalizeNoteVelocity,
  normalizeNotesState,
  sampleIdFromUrl,
  stepToBeat,
} from './sequencerModel';
import type {
  KitChannelInput,
  LegacyNotes,
  LegacySequencerState,
  PatternPackNotes,
} from './sequencerModel';
import { PERCUSSION_TYPES } from './percussion';
import { channelsSelector } from './channels';
import { notesSelector } from './notes';
import { patternSelector } from './song';

jest.mock('../presets');
jest.mock('../samples.config');

const legacyChannels: KitChannelInput[] = [
  {
    id: 'kick',
    sample: 'kick.mp3',
    gain: 1,
  },
];

const legacyNotes: LegacyNotes = {
  kick: [
    [
      {
        id: 'kick-1',
        beat: 1,
      },
      {
        id: 'kick-3',
        beat: 3,
      },
    ],
    [],
  ],
};

const legacyState = (state: unknown): LegacySequencerState => state as LegacySequencerState;

describe('time-signature grid helpers', () => {
  test('keeps current 4/4 sixteenth-note mapping', () => {
    expect(beatToStep(1)).toBe(0);
    expect(beatToStep(4.75)).toBe(15);
    expect(stepToBeat(15)).toBe(4.75);
  });

  test('supports eighth-note signatures such as 6/8', () => {
    const sixEightPattern = {
      timeSignature: {
        beatsPerBar: 6,
        beatUnit: 8,
      },
      bars: 1,
      stepsPerBeat: 2,
    };
    expect(beatToStep(3.75, sixEightPattern)).toBe(11);
    expect(stepToBeat(11, sixEightPattern)).toBe(3.75);
  });
});

describe('note velocity helpers', () => {
  test('normalizes authored note velocity to MIDI-style integers', () => {
    expect(normalizeNoteVelocity(32)).toBe(32);
    expect(normalizeNoteVelocity(80.4)).toBe(80);
    expect(normalizeNoteVelocity(-1)).toBe(MIN_NOTE_VELOCITY);
    expect(normalizeNoteVelocity(300)).toBe(MAX_NOTE_VELOCITY);
    expect(normalizeNoteVelocity(Number.NaN)).toBe(DEFAULT_NOTE_VELOCITY);
    expect(normalizeNoteVelocity(undefined)).toBe(DEFAULT_NOTE_VELOCITY);
  });
});

describe('portable note normalization', () => {
  test('generates stable local entity IDs when serialized notes omit them', () => {
    const patterns = createPatternsState({ patternCount: 1, laneIds: ['kick'] });
    const notes = normalizeNotesState({
      kick: [[
        { beat: 1 },
        { beat: 2, velocity: 32 },
      ]],
    }, patterns.ids, patterns);

    expect(notes.ids).toEqual([
      'pattern-note:kick:pattern-0:0',
      'pattern-note:kick:pattern-0:1',
    ]);
    expect(notes.entities[notes.ids[1]]).toEqual(expect.objectContaining({
      id: 'pattern-note:kick:pattern-0:1',
      laneId: 'kick',
      patternId: 'pattern-0',
      velocity: 32,
    }));
  });
});

describe('song arrangement migration', () => {
  test('normalizes legacy columns and removes duplicate pattern selections', () => {
    expect(normalizeArrangementPatternIds([
      'pattern-0',
      null,
      ['pattern-1', 'pattern-2', 'pattern-1'],
    ])).toEqual([
      ['pattern-0'],
      [],
      ['pattern-1', 'pattern-2'],
    ]);
  });
});

describe('compatibility selectors', () => {
  test('return legacy channel and note shapes from normalized state', () => {
    const patterns = createPatternsState({
      patternCount: 2,
      laneIds: ['kick'],
    });
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedPatternId: 'pattern-1',
        selectedKitId: DEFAULT_KIT_ID,
        patternIds: patterns.ids,
      },
      patterns,
      channels: normalizeChannelsState(legacyChannels),
      notes: normalizeNotesState(legacyNotes, patterns.ids, patterns),
    };

    expect(patternSelector(state)).toBe(1);
    expect(channelsSelector(state)[0].id).toBe('kick');
    expect(notesSelector(state).kick[0]).toEqual(legacyNotes.kick[0]);
  });

  test('use kit channel assignments as the exposed playback lane id', () => {
    const patterns = createPatternsState({
      patternCount: 2,
      laneIds: ['pattern-kick'],
    });
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedPatternId: 'pattern-0',
        selectedKitId: DEFAULT_KIT_ID,
        patternIds: patterns.ids,
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
            name: 'Test Kit',
            channelIds: ['kit-kick'],
          },
        },
      },
      kitChannels: normalizeChannelsState([
        {
          id: 'kit-kick',
          laneId: 'kit-kick',
          sample: 'kick.mp3',
          gain: 1,
        },
      ]),
      kitChannelAssignments: {
        ids: ['kit-kick'],
        entities: {
          'kit-kick': {
            id: 'kit-kick',
            kitId: DEFAULT_KIT_ID,
            laneId: 'pattern-kick',
            kitChannelId: 'kit-kick',
            confidence: 'high',
          },
        },
      },
      samples: {
        ids: ['sample:kick.mp3'],
        entities: {
          'sample:kick.mp3': {
            id: 'sample:kick.mp3',
            url: 'kick.mp3',
            sourceType: 'factory',
          },
        },
      },
      patterns,
      notes: normalizeNotesState({
        'pattern-kick': legacyNotes.kick,
      }, patterns.ids, patterns),
    };

    expect(channelsSelector(state)[0].id).toBe('pattern-kick');
    expect(channelsSelector(state)[0].kitChannelId).toBe('kit-kick');
    expect(notesSelector(state)['pattern-kick'][0]).toEqual(legacyNotes.kick[0]);
  });

  test('preserve non-default note velocity in legacy audio notes', () => {
    const patterns = createPatternsState({
      patternCount: 1,
      laneIds: ['kick'],
    });
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedPatternId: 'pattern-0',
        selectedKitId: DEFAULT_KIT_ID,
        patternIds: patterns.ids,
      },
      patterns,
      channels: normalizeChannelsState(legacyChannels),
      notes: normalizeNotesState({
        kick: [[{
          id: 'accent',
          beat: 1,
          velocity: 80,
        }]],
      }, patterns.ids, patterns),
    };

    expect(notesSelector(state).kick[0][0]).toEqual({
      id: 'accent',
      beat: 1,
      velocity: 80,
    });
  });

  test('omit default note velocity from legacy audio notes', () => {
    const patterns = createPatternsState({
      patternCount: 1,
      laneIds: ['kick'],
    });
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedPatternId: 'pattern-0',
        selectedKitId: DEFAULT_KIT_ID,
        patternIds: patterns.ids,
      },
      patterns,
      channels: normalizeChannelsState(legacyChannels),
      notes: normalizeNotesState({
        kick: [[{
          id: 'default-hit',
          beat: 1,
          velocity: DEFAULT_NOTE_VELOCITY,
        }]],
      }, patterns.ids, patterns),
    };

    expect(notesSelector(state).kick[0][0]).toEqual({
      id: 'default-hit',
      beat: 1,
    });
  });

  test('falls back to kitChannels ids if selected kit channelIds are stale', () => {
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedKitId: DEFAULT_KIT_ID,
        selectedPatternId: 'pattern-0',
        patternIds: ['pattern-0'],
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
            name: 'Stale Kit',
            channelIds: ['missing-channel'],
          },
        },
      },
      kitChannels: normalizeChannelsState([
        {
          id: 'available-channel',
          sample: 'available.wav',
          gain: 1,
        },
      ]),
      kitChannelAssignments: {
        ids: [],
        entities: {},
      },
      samples: {
        ids: ['sample:available.wav'],
        entities: {
          'sample:available.wav': {
            id: 'sample:available.wav',
            url: 'available.wav',
            sourceType: 'factory',
          },
        },
      },
    };

    expect(channelsSelector(state)[0].id).toBe('available-channel');
  });
});

describe('redux-persist migration', () => {
  test('normalizes legacy channel and note state', () => {
    const migrated = migrateToNormalizedSequencerState(legacyState({
      channels: legacyChannels,
      notes: legacyNotes,
      master: {
        pattern: 1,
        selectedChannel: 'kick',
      },
    }), {
      channels: legacyChannels,
      notes: legacyNotes,
    });

    expect(migrated.song.selectedPatternId).toBe('pattern-1');
    expect(migrated.channels.ids).toEqual(['kick']);
    expect(migrated.notes.entities['kick-1']).toEqual({
      id: 'kick-1',
      laneId: 'kick',
      patternId: 'pattern-0',
      step: 0,
      pitch: 0,
      velocity: 64,
    });
    expect(migrated.master).toEqual({
      selectedChannel: 'kick',
    });
  });
});


describe('kit-aware migration', () => {
  test('moves channel settings into a globally reusable kit library', () => {
    const migrated = migrateToKitSequencerState(legacyState({
      channels: legacyChannels,
      notes: legacyNotes,
      master: {
        pattern: 1,
        selectedChannel: 'kick',
      },
    }), {
      channels: legacyChannels,
      notes: legacyNotes,
    });

    expect(migrated.song.selectedKitId).toBe(DEFAULT_KIT_ID);
    expect(migrated.kits.entities[DEFAULT_KIT_ID].channelIds).toEqual(['kick']);
    expect(migrated.kitChannels.entities.kick.laneId).toBe('kick');
    expect(migrated.kitChannelAssignments.entities.kick).toEqual({
      id: 'kick',
      kitId: DEFAULT_KIT_ID,
      laneId: 'kick',
      kitChannelId: 'kick',
      confidence: 'manual',
    });
    expect(migrated.kitChannels.entities.kick.velocityLayers).toEqual([{
      id: 'kick:layer:1',
      sampleId: 'sample:kick.mp3',
      maxVelocity: 127,
      alignmentOffset: 0,
      trimDb: 0,
    }]);
    expect(migrated.kitChannels.entities.kick).not.toHaveProperty('sampleId');
    expect(migrated.kitChannels.entities.kick).not.toHaveProperty('sample');
    expect(migrated.samples.entities['sample:kick.mp3'].url).toBe('kick.mp3');
    expect(migrated.patterns.entities['pattern-0'].laneIds).toEqual(['kick']);
    expect(migrated.notes.entities['kick-1'].laneId).toBe('kick');
  });
});

describe('kit channel normalization', () => {
  test('preserves percussion metadata and defaults missing types to generic percussion', () => {
    const normalized = normalizeChannelsState([
      {
        id: 'kick',
        sample: 'kick.mp3',
        gain: 1,
        percussionType: PERCUSSION_TYPES.BASS_DRUM,
        register: 'low',
      },
      {
        id: 'mystery',
        sample: 'mystery.mp3',
        gain: 1,
      },
    ]);

    expect(normalized.entities.kick).toEqual(expect.objectContaining({
      percussionType: PERCUSSION_TYPES.BASS_DRUM,
      register: 'low',
      velocityLayers: [
        expect.objectContaining({
          sampleId: sampleIdFromUrl('kick.mp3'),
          maxVelocity: 127,
        }),
      ],
    }));
    expect(normalized.entities.kick).not.toHaveProperty('sampleId');
    expect(normalized.entities.kick).not.toHaveProperty('alignmentOffset');
    expect(normalized.entities.mystery.percussionType)
      .toBe(PERCUSSION_TYPES.GENERIC_PERCUSSION);
  });

  test('normalizes layered inputs and creates metadata for every referenced sample', () => {
    const input: KitChannelInput = {
      id: 'snare',
      sample: 'legacy-snare.wav',
      sampleId: 'sample:legacy-snare.wav',
      alignmentOffset: 0.5,
      velocityLayers: [
        {
          id: 'soft',
          sample: 'soft-snare.wav',
          maxVelocity: 63,
          alignmentOffset: 0.01,
          trimDb: -2,
        },
        {
          id: 'hard',
          sample: 'hard-snare.wav',
          maxVelocity: 127,
          alignmentOffset: 0.02,
          trimDb: 0,
        },
      ],
    };
    const samples = createSamplesState([input]);
    const normalized = normalizeChannelsState([input]).entities.snare;

    expect(samples.ids).toEqual([
      'sample:soft-snare.wav',
      'sample:hard-snare.wav',
    ]);
    expect(normalized.velocityLayers.map(layer => layer.sampleId)).toEqual(samples.ids);
    expect(normalized).not.toHaveProperty('sample');
    expect(normalized).not.toHaveProperty('sampleId');
    expect(normalized).not.toHaveProperty('alignmentOffset');
  });
});

describe('velocity-layer persistence migration', () => {
  test('migrates active channels, sample alignment, and saved Kit presets', () => {
    const versionNineState = legacyState({
      kitChannels: {
        ids: ['kick'],
        entities: {
          kick: {
            id: 'kick',
            kitId: DEFAULT_KIT_ID,
            laneId: 'kick',
            percussionType: PERCUSSION_TYPES.BASS_DRUM,
            sampleId: 'sample:kick.wav',
            sampleLoaded: true,
          },
        },
      },
      samples: {
        ids: ['sample:kick.wav'],
        entities: {
          'sample:kick.wav': {
            id: 'sample:kick.wav',
            name: 'Kick',
            url: 'kick.wav',
            sourceType: 'user',
            alignmentOffset: 0.045,
          },
        },
      },
      presets: {
        preset: 'Saved Kit',
        userPresets: [{
          name: 'Saved Kit',
          channels: [{
            id: 'saved-kick',
            sample: 'kick.wav',
            sampleId: 'sample:kick.wav',
            alignmentOffset: 0.08,
          }],
        }],
      },
    } as unknown);

    const migrated = migrateToVelocityLayerSequencerState(versionNineState);
    const activeChannel = migrated.kitChannels?.entities.kick;
    const presets = migrated.presets as {
      userPresets: Array<{ channels: KitChannelInput[] }>;
    };

    expect(activeChannel?.velocityLayers).toEqual([{
      id: 'kick:layer:1',
      sampleId: 'sample:kick.wav',
      maxVelocity: 127,
      alignmentOffset: 0.045,
      trimDb: 0,
    }]);
    expect(activeChannel).not.toHaveProperty('sampleId');
    expect(activeChannel).not.toHaveProperty('sampleLoaded');
    expect(migrated.samples?.entities['sample:kick.wav']).not.toHaveProperty(
      'alignmentOffset',
    );
    expect(presets.userPresets[0].channels[0]).toEqual(expect.objectContaining({
      id: 'saved-kick',
      velocityLayers: [{
        id: 'saved-kick:layer:1',
        sample: 'kick.wav',
        sampleId: 'sample:kick.wav',
        maxVelocity: 127,
        alignmentOffset: 0.08,
        trimDb: 0,
      }],
    }));
    expect(presets.userPresets[0].channels[0]).not.toHaveProperty('sampleId');
    expect(migrateToVelocityLayerSequencerState(
      migrated as unknown as LegacySequencerState,
    ).kitChannels).toEqual(migrated.kitChannels);
  });
});

describe('MIDI velocity persistence migration', () => {
  test('converts normalized notes and saved user Pattern Packs from multipliers', () => {
    const migrated = migrateToMidiVelocitySequencerState(legacyState({
      notes: {
        ids: ['silent', 'ghost', 'main', 'accent', 'maximum'],
        entities: {
          silent: {
            id: 'silent',
            laneId: 'kick',
            patternId: 'pattern-0',
            step: 0,
            pitch: 0,
            velocity: 0,
          },
          ghost: {
            id: 'ghost',
            laneId: 'kick',
            patternId: 'pattern-0',
            step: 1,
            pitch: 0,
            velocity: 0.5,
          },
          main: {
            id: 'main',
            laneId: 'kick',
            patternId: 'pattern-0',
            step: 2,
            pitch: 0,
            velocity: 1,
          },
          accent: {
            id: 'accent',
            laneId: 'kick',
            patternId: 'pattern-0',
            step: 3,
            pitch: 0,
            velocity: 1.25,
          },
          maximum: {
            id: 'maximum',
            laneId: 'kick',
            patternId: 'pattern-0',
            step: 4,
            pitch: 0,
            velocity: 2,
          },
        },
      },
      patternPacks: {
        selectedPatternPackId: 'saved-pack',
        userPatternPacks: [{
          id: 'saved-pack',
          name: 'Saved Pack',
          bpm: 120,
          swing: 0,
          lanes: [{ id: 'kick' }],
          notes: {
            kick: [[
              { beat: 1 },
              { beat: 2, velocity: 0.5 },
              { beat: 3, velocity: 1.25 },
            ]],
          },
        }],
      },
    }));
    const notes = migrated.notes as {
      entities: Record<string, { velocity: number }>;
    };
    const patternPacks = migrated.patternPacks as {
      userPatternPacks: Array<{ notes: PatternPackNotes }>;
    };

    expect([
      notes.entities.silent.velocity,
      notes.entities.ghost.velocity,
      notes.entities.main.velocity,
      notes.entities.accent.velocity,
      notes.entities.maximum.velocity,
    ]).toEqual([0, 32, 64, 80, 127]);
    expect(patternPacks.userPatternPacks[0].notes.kick[0]).toEqual([
      { beat: 1 },
      { beat: 2, velocity: 32 },
      { beat: 3, velocity: 80 },
    ]);
  });
});
