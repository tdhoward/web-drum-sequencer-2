import { createDefaultSequencerState } from './defaultSequencerState';
import {
  isSequencerModelStateValid,
  validateSequencerModelState,
} from './sequencerModelInvariants';

jest.mock('../presets');

const clone = value => JSON.parse(JSON.stringify(value));

describe('sequencer model invariants', () => {
  test('accepts the default kit-aware sequencer model', () => {
    const state = createDefaultSequencerState();

    expect(validateSequencerModelState(state)).toEqual([]);
    expect(isSequencerModelStateValid(state)).toBe(true);
  });

  test('detects a song selected kit that is missing from the global kit library', () => {
    const state = clone(createDefaultSequencerState());
    state.song.selectedKitId = 'missing-kit';

    expect(validateSequencerModelState(state)).toContain(
      'song.selectedKitId does not exist: missing-kit',
    );
    expect(isSequencerModelStateValid(state)).toBe(false);
  });

  test('detects a pattern lane without a selected-kit channel', () => {
    const state = clone(createDefaultSequencerState());
    const patternId = state.song.patternIds[0];
    state.patterns.entities[patternId].laneIds.push('missing-lane');

    expect(validateSequencerModelState(state)).toContain(
      `pattern ${patternId} laneId has no selected-kit channel: missing-lane`,
    );
  });

  test('detects notes that reference lanes outside their pattern', () => {
    const state = clone(createDefaultSequencerState());
    const noteId = 'bad-note';
    const patternId = state.song.patternIds[0];

    state.notes.ids.push(noteId);
    state.notes.entities[noteId] = {
      id: noteId,
      patternId,
      laneId: 'missing-lane',
      step: 0,
      pitch: 0,
      velocity: 1,
    };

    expect(validateSequencerModelState(state)).toContain(
      `note ${noteId} references laneId not used by pattern ${patternId}: missing-lane`,
    );
  });

  test('detects notes that reference missing patterns', () => {
    const state = clone(createDefaultSequencerState());
    const noteId = 'bad-note';

    state.notes.ids.push(noteId);
    state.notes.entities[noteId] = {
      id: noteId,
      patternId: 'missing-pattern',
      laneId: state.patterns.entities[state.song.selectedPatternId].laneIds[0],
      step: 0,
      pitch: 0,
      velocity: 1,
    };

    expect(validateSequencerModelState(state)).toContain(
      `note ${noteId} references missing patternId: missing-pattern`,
    );
  });

  test('detects kit channels that reference missing samples', () => {
    const state = clone(createDefaultSequencerState());
    const kitChannelId = state.kitChannels.ids[0];

    state.kitChannels.entities[kitChannelId].sampleId = 'missing-sample';

    expect(validateSequencerModelState(state)).toContain(
      `kitChannel ${kitChannelId} references missing sampleId: missing-sample`,
    );
  });

  test('detects kit channels with invalid percussion types', () => {
    const state = clone(createDefaultSequencerState());
    const kitChannelId = state.kitChannels.ids[0];

    state.kitChannels.entities[kitChannelId].percussionType = 'laser_whistle';

    expect(validateSequencerModelState(state)).toContain(
      `kitChannel ${kitChannelId} has invalid percussionType: laser_whistle`,
    );
  });

  test('detects assignments that reference missing kit channels', () => {
    const state = clone(createDefaultSequencerState());
    const assignmentId = state.kitChannelAssignments.ids[0];

    state.kitChannelAssignments.entities[assignmentId].kitChannelId = 'missing-channel';

    expect(validateSequencerModelState(state)).toContain(
      `kitChannelAssignment ${assignmentId} references missing kitChannelId: missing-channel`,
    );
  });
});
