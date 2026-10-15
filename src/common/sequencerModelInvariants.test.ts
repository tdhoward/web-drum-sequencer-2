import { createDefaultSequencerState } from './defaultSequencerState';
import {
  isSequencerModelStateValid,
  validateSequencerModelState,
} from './sequencerModelInvariants';

jest.mock('../presets');

const clone = <TValue>(value: TValue): TValue => JSON.parse(JSON.stringify(value)) as TValue;

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

  test('detects an arrangement entry that references a missing pattern', () => {
    const state = clone(createDefaultSequencerState());
    state.song.arrangementPatternIds = [['missing-pattern']];

    expect(validateSequencerModelState(state)).toContain(
      'song.arrangementPatternIds contains missing patternId: missing-pattern',
    );
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
      velocity: 64,
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
      velocity: 64,
    };

    expect(validateSequencerModelState(state)).toContain(
      `note ${noteId} references missing patternId: missing-pattern`,
    );
  });

  test('detects kit channels that reference missing samples', () => {
    const state = clone(createDefaultSequencerState());
    const kitChannelId = state.kitChannels.ids[0];
    const layer = state.kitChannels.entities[kitChannelId].velocityLayers[0];

    layer.sampleId = 'missing-sample';

    expect(validateSequencerModelState(state)).toContain(
      `kitChannel ${kitChannelId} velocityLayer ${layer.id} `
      + 'references missing sampleId: missing-sample',
    );
  });

  test('detects notes outside the integer MIDI velocity domain', () => {
    const state = clone(createDefaultSequencerState());
    const patternId = state.song.patternIds[0];
    const laneId = state.patterns.entities[patternId].laneIds[0];
    const noteId = 'fractional-velocity';
    state.notes.ids.push(noteId);
    state.notes.entities[noteId] = {
      id: noteId,
      patternId,
      laneId,
      step: 0,
      pitch: 0,
      velocity: 64.5,
    };

    expect(validateSequencerModelState(state)).toContain(
      `note ${noteId} velocity must be an integer from 0 to 127`,
    );
  });

  test('accepts valid velocity layers and checks every layer sample reference', () => {
    const state = clone(createDefaultSequencerState());
    const kitChannelId = state.kitChannels.ids[0];
    const sampleId = state.kitChannels.entities[kitChannelId].velocityLayers[0].sampleId;
    state.kitChannels.entities[kitChannelId].velocityLayers = [
      {
        id: `${kitChannelId}:soft`,
        sampleId,
        maxVelocity: 63,
        alignmentOffset: 0,
        trimDb: -3,
      },
      {
        id: `${kitChannelId}:hard`,
        sampleId,
        maxVelocity: 127,
        alignmentOffset: 0.01,
        trimDb: 0,
      },
    ];

    expect(validateSequencerModelState(state)).toEqual([]);

    state.kitChannels.entities[kitChannelId].velocityLayers[1].sampleId = 'missing-layer-sample';
    expect(validateSequencerModelState(state)).toContain(
      `kitChannel ${kitChannelId} velocityLayer ${kitChannelId}:hard `
      + 'references missing sampleId: missing-layer-sample',
    );
  });

  test('detects invalid velocity layer ranges', () => {
    const state = clone(createDefaultSequencerState());
    const kitChannelId = state.kitChannels.ids[0];
    const sampleId = state.kitChannels.entities[kitChannelId].velocityLayers[0].sampleId;
    state.kitChannels.entities[kitChannelId].velocityLayers = [
      {
        id: `${kitChannelId}:soft`,
        sampleId,
        maxVelocity: 80,
        alignmentOffset: 0,
        trimDb: 0,
      },
      {
        id: `${kitChannelId}:hard`,
        sampleId,
        maxVelocity: 80,
        alignmentOffset: 0,
        trimDb: 0,
      },
    ];

    expect(validateSequencerModelState(state)).toEqual(expect.arrayContaining([
      `kitChannel ${kitChannelId} velocityLayers[1].maxVelocity must be strictly increasing`,
      `kitChannel ${kitChannelId} velocityLayers must end at 127`,
    ]));
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
