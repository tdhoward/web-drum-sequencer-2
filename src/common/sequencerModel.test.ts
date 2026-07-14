import {
  beatToStep,
  createPatternsState,
  DEFAULT_KIT_ID,
  DEFAULT_NOTE_VELOCITY,
  MAX_NOTE_VELOCITY,
  MIN_NOTE_VELOCITY,
  migrateToKitSequencerState,
  migrateToNormalizedSequencerState,
  normalizeArrangementPatternIds,
  normalizeChannelsState,
  normalizeNoteVelocity,
  normalizeNotesState,
  sampleIdFromUrl,
  stepToBeat,
} from './sequencerModel';
import type { KitChannelInput, LegacyNotes, LegacySequencerState } from './sequencerModel';
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
  test('normalizes authored note velocity multipliers', () => {
    expect(normalizeNoteVelocity(0.5)).toBe(0.5);
    expect(normalizeNoteVelocity(1.25)).toBe(1.25);
    expect(normalizeNoteVelocity(-1)).toBe(MIN_NOTE_VELOCITY);
    expect(normalizeNoteVelocity(3)).toBe(MAX_NOTE_VELOCITY);
    expect(normalizeNoteVelocity(Number.NaN)).toBe(DEFAULT_NOTE_VELOCITY);
    expect(normalizeNoteVelocity(undefined)).toBe(DEFAULT_NOTE_VELOCITY);
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
          velocity: 0.7,
        }]],
      }, patterns.ids, patterns),
    };

    expect(notesSelector(state).kick[0][0]).toEqual({
      id: 'accent',
      beat: 1,
      velocity: 0.7,
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
      velocity: 1,
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
    expect(migrated.kitChannels.entities.kick.sampleId).toBe('sample:kick.mp3');
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
      sampleId: sampleIdFromUrl('kick.mp3'),
    }));
    expect(normalized.entities.mystery.percussionType)
      .toBe(PERCUSSION_TYPES.GENERIC_PERCUSSION);
  });
});
