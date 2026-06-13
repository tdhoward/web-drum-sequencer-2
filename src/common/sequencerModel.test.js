import {
  beatToStep,
  createPatternsState,
  migrateToNormalizedSequencerState,
  normalizeChannelsState,
  normalizeNotesState,
  stepToBeat,
} from './sequencerModel';
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
      channelIds: ['kick'],
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
      channelId: 'kick',
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
