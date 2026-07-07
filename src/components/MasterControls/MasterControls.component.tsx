import React from 'react';
import styled from 'styled-components';
import { Box } from '../design-system';
import { PlayButton } from '../PlayButton';
import { BPMInput } from '../BPMInput';
import { SwingControl } from '../SwingControl';
import { HumanizeControl } from '../HumanizeControl';

const MasterControlsLayout = styled.div`
  align-items: stretch;
  display: flex;
  height: 3rem;
`;

export const MasterControls = () => (
  <MasterControlsLayout>
    <Box display="flex">
      <Box mr={2} display="flex" alignItems="center">
        <PlayButton />
      </Box>
      <BPMInput />
      <SwingControl />
      <HumanizeControl />
    </Box>
  </MasterControlsLayout>
);
