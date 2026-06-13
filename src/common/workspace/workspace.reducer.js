import { createSlice } from '@reduxjs/toolkit';

export const WORKSPACES = {
  PATTERN: 'pattern',
  KIT: 'kit',
  SONG: 'song',
};

export const workspaceInitialState = {
  selectedWorkspace: WORKSPACES.PATTERN,
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: workspaceInitialState,
  reducers: {
    setSelectedWorkspace(state, action) {
      if (Object.values(WORKSPACES).includes(action.payload)) {
        state.selectedWorkspace = action.payload;
      }
    },
  },
});

export const {
  setSelectedWorkspace,
} = workspaceSlice.actions;

export const workspaceReducer = workspaceSlice.reducer;
