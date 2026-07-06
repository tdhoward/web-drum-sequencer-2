import {
  addNote,
  setNoteVelocity,
} from './notes.reducer';
import { setNoteVelocityAtBeat } from './notes.actions';
import {
  createPatternsState,
  normalizeNotesState,
} from '../sequencerModel';
import type { NotesState, PatternsState } from '../sequencerModel';

jest.mock('../../presets');
jest.mock('../../samples.config');

type TestState = {
  notes: NotesState;
  patterns: PatternsState;
};

const createTestState = (): TestState => {
  const patterns = createPatternsState({
    patternCount: 1,
    laneIds: ['kick'],
  });

  return {
    patterns,
    notes: normalizeNotesState({
      kick: [[{
        id: 'kick-1',
        beat: 1,
      }]],
    }, patterns.ids, patterns),
  };
};

describe('setNoteVelocityAtBeat', () => {
  test('updates an existing note at the requested beat', () => {
    const state = createTestState();
    const dispatch = jest.fn();

    setNoteVelocityAtBeat('kick', 0, 1, 1.25)(dispatch, () => state);

    expect(dispatch).toHaveBeenCalledWith(setNoteVelocity({
      id: 'kick-1',
      velocity: 1.25,
    }));
  });

  test('creates a note when no note exists at the requested beat', () => {
    const state = createTestState();
    const dispatch = jest.fn();

    setNoteVelocityAtBeat('kick', 0, 2, 0.5)(dispatch, () => state);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toEqual(addNote({
      id: expect.any(String),
      laneId: 'kick',
      patternId: 'pattern-0',
      step: 4,
      pitch: 0,
      velocity: 0.5,
    }));
  });
});
