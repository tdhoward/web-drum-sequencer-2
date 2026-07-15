import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const WORKSPACES = {
  PATTERN: 'pattern',
  KIT: 'kit',
  SONG: 'song',
} as const;

export type Workspace = typeof WORKSPACES[keyof typeof WORKSPACES];

export type WorkspaceState = {
  selectedWorkspace: Workspace;
  selectedSongTempoColumn: number;
};

export const workspaceInitialState: WorkspaceState = {
  selectedWorkspace: WORKSPACES.PATTERN,
  selectedSongTempoColumn: 0,
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
        if (action.payload === WORKSPACES.SONG) {
          state.selectedSongTempoColumn = 0;
        }
      }
    },
    setSelectedSongTempoColumn(state, action: PayloadAction<number>) {
      if (Number.isInteger(action.payload) && action.payload >= 0) {
        state.selectedSongTempoColumn = action.payload;
      }
    },
  },
});

export const {
  setSelectedWorkspace,
  setSelectedSongTempoColumn,
} = workspaceSlice.actions;

export const workspaceReducer = workspaceSlice.reducer;
