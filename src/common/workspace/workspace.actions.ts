import {
  activeTempoColumnSelector,
  playbackModeSelector,
  playingSelector,
} from '../playbackSession/playbackSession.selectors';
import { PLAYBACK_MODES } from '../playbackSession/playbackSession.reducer';
import {
  setSelectedSongTempoColumn,
  setSelectedWorkspace,
  WORKSPACES,
} from './workspace.reducer';
import type { Workspace } from './workspace.reducer';

type WorkspaceActionState = Parameters<typeof playingSelector>[0];
type Dispatch = (action: unknown) => void;

export const selectWorkspace = (workspace: Workspace) => (
  dispatch: Dispatch,
  getState: () => WorkspaceActionState,
): void => {
  dispatch(setSelectedWorkspace(workspace));
  if (workspace === WORKSPACES.SONG) {
    const state = getState();
    const selectedTempoColumn = playingSelector(state)
      && playbackModeSelector(state) === PLAYBACK_MODES.SONG
      ? activeTempoColumnSelector(state)
      : 0;
    dispatch(setSelectedSongTempoColumn(selectedTempoColumn));
  }
};
