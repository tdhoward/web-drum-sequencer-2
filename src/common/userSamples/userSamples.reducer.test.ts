import {
  addUserSample,
  removeUserSample,
  renameUserSample,
} from './userSamples.actions';
import {
  getUserSampleDisplayName,
  getUserSampleId,
  normalizeUserSample,
  userSamplesReducer,
} from './userSamples.reducer';
import type { UserSamplesState } from './userSamples.reducer';

describe('user samples reducer', () => {
  test('adds user sample metadata records', () => {
    const state = userSamplesReducer(undefined, addUserSample({
      id: 'kick-edit.wav',
      name: 'Kick Edit',
      sourceType: 'edited',
    }));

    expect(state).toHaveLength(1);
    expect(getUserSampleId(state[0])).toEqual('kick-edit.wav');
    expect(getUserSampleDisplayName(state[0])).toEqual('Kick Edit');
    expect(normalizeUserSample(state[0]).sourceType).toEqual('edited');
  });

  test('adds recorded user sample metadata records', () => {
    const state = userSamplesReducer(undefined, addUserSample({
      id: 'snare-recorded.wav',
      name: 'Snare Recording',
      sourceType: 'recorded',
    }));

    expect(state).toHaveLength(1);
    expect(getUserSampleDisplayName(state[0])).toEqual('Snare Recording');
    expect(normalizeUserSample(state[0]).sourceType).toEqual('recorded');
  });

  test('upserts duplicate user sample ids', () => {
    const state = userSamplesReducer([
      {
        id: 'kick-edit.wav',
        name: 'Kick Edit',
      },
    ], addUserSample({
      id: 'kick-edit.wav',
      name: 'Kick Edit 2',
    }));

    expect(state).toHaveLength(1);
    expect(getUserSampleDisplayName(state[0])).toEqual('Kick Edit 2');
  });

  test('renames legacy string samples by converting them to metadata records', () => {
    const state = userSamplesReducer(
      ['legacy.wav'],
      renameUserSample('legacy.wav', 'Legacy Kick'),
    );

    expect(state).toEqual([{
      id: 'legacy.wav',
      name: 'Legacy Kick',
    }]);
  });

  test('removes legacy string samples by id', () => {
    const state = userSamplesReducer(
      ['legacy.wav', { id: 'edited.wav', name: 'Edited' }],
      removeUserSample('legacy.wav'),
    );

    expect(state).toEqual([{ id: 'edited.wav', name: 'Edited' }]);
  });

  test('normalizes empty metadata names to the sample id', () => {
    const userSample = normalizeUserSample({
      id: 'trim.wav',
      name: ' ',
    });

    expect(userSample.name).toEqual('trim.wav');
  });

  test('ignores blank rename requests', () => {
    const originalState: UserSamplesState = [{ id: 'edit.wav', name: 'Edit' }];
    const state = userSamplesReducer(originalState, renameUserSample('edit.wav', ' '));

    expect(state).toEqual(originalState);
  });
});
