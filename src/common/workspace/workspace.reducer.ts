import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const WORKSPACES = {
  PATTERN: 'pattern',
  KIT: 'kit',
  SONG: 'song',
} as const;

export type Workspace = typeof WORKSPACES[keyof typeof WORKSPACES];

export type WorkspaceState = {
  selectedWorkspace: Workspace;
};

export const workspaceInitialState: WorkspaceState = {
  selectedWorkspace: WORKSPACES.PATTERN,
};

const isWorkspace = (value: string): value is Workspace => (
  Object.values(WORKSPACES).includes(value as Workspace)
);

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: workspaceInitialState,
  reducers: {
    setSelectedWorkspace(state, action: PayloadAction<string>) {
      if (isWorkspace(action.payload)) {
        state.selectedWorkspace = action.payload;
      }
    },
  },
});

export const {
  setSelectedWorkspace,
} = workspaceSlice.actions;

export const workspaceReducer = workspaceSlice.reducer;
