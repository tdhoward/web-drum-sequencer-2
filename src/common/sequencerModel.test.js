import {
  beatToStep,
  createPatternsState,
  DEFAULT_KIT_ID,
  migrateToKitSequencerState,
  migrateToNormalizedSequencerState,
  normalizeChannelsState,
  normalizeNotesState,
  sampleIdFromUrl,
  stepToBeat,
} from './sequencerModel';
import { PERCUSSION_TYPES } from './percussion';
import { channelsSelector } from './channels';
import { notesSelector } from './notes';
import { patternSelector } from './song';

jest.mock('../presets');
jest.mock('../samples.config');

const legacyChannels = [
  {
    id: 'kick',
    sample: 'kick.mp3',
    gain: 1,
  },
];

const legacyNotes = {
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
        patternIds: patterns.ids,
      },
      patterns,
      channels: normalizeChannelsState(legacyChannels, legacyNotes, patterns.ids),
      notes: normalizeNotesState(legacyNotes, patterns.ids, patterns),
    };

    expect(patternSelector(state)).toBe(1);
    expect(channelsSelector(state)[0].id).toBe('kick');
    expect(notesSelector(state).kick[0]).toEqual(legacyNotes.kick[0]);
  });
});

describe('redux-persist migration', () => {
  test('normalizes legacy channel and note state', () => {
    const migrated = migrateToNormalizedSequencerState({
      channels: legacyChannels,
      notes: legacyNotes,
      master: {
        pattern: 1,
        selectedChannel: 'kick',
      },
    }, {
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
    const migrated = migrateToKitSequencerState({
      channels: legacyChannels,
      notes: legacyNotes,
      master: {
        pattern: 1,
        selectedChannel: 'kick',
      },
    }, {
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
