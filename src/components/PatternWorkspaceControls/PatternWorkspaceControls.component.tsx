import React from 'react';
import { Box } from '../design-system';
import { PatternPackSelector } from '../PatternPackSelector';
import { PatternSelector } from '../PatternSelector';
import { CurrentKitDisplay } from '../CurrentKitDisplay';
import { WorkspaceControls } from '../WorkspaceControls';

export const PatternWorkspaceControls = () => (
  <WorkspaceControls label="PATTERN CONTROLS">
    <CurrentKitDisplay />
    <Box width={['100%', '18rem']}>
      <PatternPackSelector />
    </Box>
    <PatternSelector />
  </WorkspaceControls>
);
