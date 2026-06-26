import {
  kitChannelAssignmentsInitialState,
  kitChannelAssignmentsReducer,
  setKitChannelAssignment,
} from './kitChannelAssignments.reducer';
import {
  addChannel,
  removeChannel,
  replaceChannels,
} from '../channels';

jest.mock('../../presets');
jest.mock('../../samples.config');

describe('kitChannelAssignmentsReducer', () => {
  test('sets a channel assignment lane', () => {
    const assignmentId = kitChannelAssignmentsInitialState.ids[0];
    const state = kitChannelAssignmentsReducer(
      kitChannelAssignmentsInitialState,
      setKitChannelAssignment(assignmentId, 'snare_drum', 'high'),
    );

    expect(state.entities[assignmentId].laneId).toBe('snare_drum');
    expect(state.entities[assignmentId].confidence).toBe('high');
  });

  test('mirrors added and removed channels', () => {
    const added = kitChannelAssignmentsReducer(
      kitChannelAssignmentsInitialState,
      addChannel({
        id: 'user-channel',
        laneId: 'user-channel',
        sample: 'user.wav',
      }),
    );

    expect(added.entities['user-channel']).toEqual(expect.objectContaining({
      laneId: 'user-channel',
      kitChannelId: 'user-channel',
    }));

    const removed = kitChannelAssignmentsReducer(added, removeChannel('user-channel'));

    expect(removed.entities['user-channel']).toBeUndefined();
  });

  test('replaces assignments when channels are replaced', () => {
    const state = kitChannelAssignmentsReducer(
      kitChannelAssignmentsInitialState,
      replaceChannels([
        {
          id: 'bass_drum',
          sample: 'bass.wav',
        },
      ]),
    );

    expect(state.ids).toEqual(['bass_drum']);
    expect(state.entities.bass_drum).toEqual(expect.objectContaining({
      laneId: 'bass_drum',
      kitChannelId: 'bass_drum',
    }));
  });
});
