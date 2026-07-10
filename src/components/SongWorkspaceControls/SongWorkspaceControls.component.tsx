import React from 'react';
import { Box } from '../design-system';
import { SongPresetSelector } from '../SongPresetSelector';
import { WorkspaceControls } from '../WorkspaceControls';

export const SongWorkspaceControls = () => (
  <WorkspaceControls label="SONG CONTROLS">
    <Box width={['100%', '18rem']}>
      <SongPresetSelector />
    </Box>
  </WorkspaceControls>
);
