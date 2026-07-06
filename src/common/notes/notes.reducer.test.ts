import {
  addNote,
  notesReducer,
  removeChannelNotes,
  removeNote,
  setNoteVelocity,
  setNotes,
} from './notes.reducer';
import {
  DEFAULT_NOTE_VELOCITY,
  MAX_NOTE_VELOCITY,
  normalizeNotesState,
} from '../sequencerModel';

jest.mock('../../presets');
jest.mock('../../samples.config');

const legacyTestNotes = {
  bongo: [
    [
      {
        id: 'bing',
        beat: 1,
      },
      {
        id: 'bong',
        beat: 3,
      },
    ],
    [
      {
        id: 'ping',
        beat: 2,
      },
      {
        id: 'pang',
        beat: 4,
      },
    ],
  ],
};

const testNotes = normalizeNotesState(legacyTestNotes);

describe('addNote', () => {
  test('should add a note', () => {
    const state = notesReducer(testNotes, addNote({
      id: 'new-note',
      laneId: 'bongo',
      patternId: 'pattern-0',
      step: 4,
      pitch: 0,
      velocity: 1,
    }));
    expect(state.ids).toContain('new-note');
    expect(state.entities['new-note']).not.toBeUndefined();
  });
});

describe('removeNote', () => {
  test('should remove a note', () => {
    const state = notesReducer(testNotes, removeNote({
      id: 'bing',
    }));
    expect(state.ids).not.toContain('bing');
    expect(state.entities.bing).toBeUndefined();
  });
});

describe('setNoteVelocity', () => {
  test('updates a note velocity multiplier', () => {
    const state = notesReducer(testNotes, setNoteVelocity({
      id: 'bing',
      velocity: 1.25,
    }));

    expect(state.entities.bing.velocity).toBe(1.25);
  });

  test('resets a note to the default velocity multiplier', () => {
    const accentedNotes = notesReducer(testNotes, setNoteVelocity({
      id: 'bing',
      velocity: 0.5,
    }));
    const resetNotes = notesReducer(accentedNotes, setNoteVelocity({
      id: 'bing',
      velocity: DEFAULT_NOTE_VELOCITY,
    }));

    expect(resetNotes.entities.bing.velocity).toBe(DEFAULT_NOTE_VELOCITY);
  });

  test('clamps note velocity multipliers to the supported authored range', () => {
    const state = notesReducer(testNotes, setNoteVelocity({
      id: 'bing',
      velocity: 10,
    }));

    expect(state.entities.bing.velocity).toBe(MAX_NOTE_VELOCITY);
  });

  test('ignores unknown note ids', () => {
    const state = notesReducer(testNotes, setNoteVelocity({
      id: 'unknown-note',
      velocity: 0.5,
    }));

    expect(state).toEqual(testNotes);
  });
});

describe('removeChannel', () => {
  test('should remove a channel that exists', () => {
    const state = notesReducer(
      testNotes,
      removeChannelNotes('bongo'),
    );
    expect(state.ids.length).toBe(0);
  });

  test('should do nothing if no channel matches the ID', () => {
    const state = notesReducer(
      testNotes,
      removeChannelNotes('foobar'),
    );
    expect(state.ids.length).toBe(testNotes.ids.length);
  });
});

describe('setNotes', () => {
  test('should replace existing channels', () => {
    const state = notesReducer(
      testNotes,
      setNotes({
        maracas: [
          [],
          [],
        ],
      }),
    );
    expect(state.ids.length).toBe(0);
    expect(state.entities.bing).toBeUndefined();
  });
});
