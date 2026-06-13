import {
  addNote,
  notesReducer,
  removeChannelNotes,
  removeNote,
  setNotes,
} from './notes.reducer';
import { normalizeNotesState } from '../sequencerModel';

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
      laneId: 'bongo',
    }));
    expect(state.ids).not.toContain('bing');
    expect(state.entities.bing).toBeUndefined();
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
