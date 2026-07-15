import { WORKSPACES } from './workspace.reducer';
import type { Workspace, WorkspaceState } from './workspace.reducer';

type WorkspaceRootState = {
  workspace?: WorkspaceState;
};

export const selectedWorkspaceSelector = (state: WorkspaceRootState): Workspace => (
  state.workspace?.selectedWorkspace || WORKSPACES.PATTERN
);

export const selectedSongTempoColumnSelector = (state: WorkspaceRootState): number => (
  state.workspace?.selectedSongTempoColumn || 0
);
