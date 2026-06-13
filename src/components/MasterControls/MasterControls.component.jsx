import React from 'react';
import styled from 'styled-components';
import { Box } from '../design-system';
import { PlayButton } from '../PlayButton';
import { BPMInput } from '../BPMInput';
import { PresetSelector } from '../PresetSelector';
import { PatternSelector } from '../PatternSelector';
import { SwingControl } from '../SwingControl';
import { VolumeMeter } from '../VolumeMeter.component';
import { WorkspaceNav } from '../WorkspaceNav';

const MasterControlsLayout = styled.div`
  align-items: stretch;
  display: flex;
  height: 3rem;
  justify-content: space-between;
  margin-bottom: 1rem;
  position: relative;

  .workspace-nav-slot {
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .right-controls {
    display: flex;
    margin-left: auto;
  }

  @media (max-width: 1024px) {
    align-items: center;
    flex-wrap: wrap;
    height: auto;
    row-gap: 0.75rem;

    .workspace-nav-slot {
      display: flex;
      justify-content: center;
      order: 3;
      position: static;
      transform: none;
      width: 100%;
    }

    .right-controls {
      margin-left: 0;
    }
  }
`;

export const MasterControls = () => (
  <MasterControlsLayout>
    <Box display="flex" mr={2}>
      <Box mr={2} display="flex" alignItems="center">
        <PlayButton />
        <VolumeMeter />
      </Box>
      <BPMInput />
      <SwingControl />
    </Box>
    <div className="workspace-nav-slot">
      <WorkspaceNav />
    </div>
    <div className="right-controls">
      <PatternSelector />
      <Box ml={2} width="15rem">
        <PresetSelector />
      </Box>
    </div>
  </MasterControlsLayout>
);
