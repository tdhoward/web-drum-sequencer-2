import {
  setSelectedSongTempoColumn,
  setSelectedWorkspace,
  workspaceInitialState,
  workspaceReducer,
  WORKSPACES,
} from './workspace.reducer';
import { selectWorkspace } from './workspace.actions';
import {
  playbackSessionInitialState,
  PLAYBACK_MODES,
} from '../playbackSession/playbackSession.reducer';

describe('song tempo selection', () => {
  test('resets to the first tempo marker whenever Song is entered', () => {
    let state = workspaceReducer(workspaceInitialState, setSelectedSongTempoColumn(3));
    state = workspaceReducer(state, setSelectedWorkspace(WORKSPACES.PATTERN));
    state = workspaceReducer(state, setSelectedWorkspace(WORKSPACES.SONG));

    expect(state.selectedSongTempoColumn).toBe(0);
  });
});

describe('selectWorkspace', () => {
  test('keeps the playing Song tempo marker selected when Song is opened', () => {
    const dispatch = jest.fn();
    const state = {
      playbackSession: {
        ...playbackSessionInitialState,
        playing: true,
        mode: PLAYBACK_MODES.SONG,
        activeTempoColumn: 3,
      },
    };

    selectWorkspace(WORKSPACES.SONG)(dispatch, () => state);

    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      setSelectedWorkspace(WORKSPACES.SONG),
      setSelectedSongTempoColumn(3),
    ]);
  });
});
