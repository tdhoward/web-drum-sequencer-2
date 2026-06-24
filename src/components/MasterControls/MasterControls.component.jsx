import React from 'react';
import styled from 'styled-components';
import { Box } from '../design-system';
import { PlayButton } from '../PlayButton';
import { BPMInput } from '../BPMInput';
import { SwingControl } from '../SwingControl';
import { VolumeMeter } from '../VolumeMeter.component';
import { WorkspaceNav } from '../WorkspaceNav';

const MasterControlsLayout = styled.div`
  align-items: stretch;
  display: flex;
  height: 3rem;
  justify-content: space-between;
  margin-bottom: 1rem;

  .right-controls {
    align-items: center;
    display: flex;
    margin-left: auto;
  }

  @media (max-width: 1024px) {
    align-items: center;
    flex-wrap: wrap;
    height: auto;
    row-gap: 0.75rem;

    .right-controls {
      justify-content: flex-end;
      margin-left: auto;
    }
  }

  @media (max-width: 720px) {
    .right-controls {
      justify-content: center;
      width: 100%;
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
    <div className="right-controls">
      <WorkspaceNav />
    </div>
  </MasterControlsLayout>
);
