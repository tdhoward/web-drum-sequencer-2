import React from 'react';
import { CurrentKitDisplay } from '../CurrentKitDisplay';
import { WorkspaceControls } from '../WorkspaceControls';

export const SongWorkspaceControls = () => (
  <WorkspaceControls label="SONG CONTROLS">
    <CurrentKitDisplay />
  </WorkspaceControls>
);
