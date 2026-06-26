import React from 'react';
import styled from 'styled-components';
import { Box } from '../design-system';
import { LabelBox } from '../LabelBox';
import { PatternPackSelector } from '../PatternPackSelector';
import { PatternSelector } from '../PatternSelector';
import { CurrentKitDisplay } from '../CurrentKitDisplay';

const ControlCluster = styled(Box)`
  background-color: ${({ theme }) => theme.colors.surfacePanel};
  border-radius: 0.3rem;
  display: flex;
  margin: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.8rem;
`;

const ChannelControlsLayout = styled.div`
  align-items: stretch;
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  .pattern-workspace-controls {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
    margin: 0.5rem 0.5rem 0.5rem auto;
  }

  @media (max-width: 1024px) {
    .pattern-workspace-controls {
      margin-left: 0.5rem;
      width: 100%;
    }
  }
`;

export const ChannelControlsComponent = () => (
  <LabelBox label="PATTERN CONTROLS">
    <ChannelControlsLayout>
      <div className="pattern-workspace-controls">
        <ControlCluster>
          <CurrentKitDisplay />
          <Box width={['100%', '18rem']}>
            <PatternPackSelector />
          </Box>
          <PatternSelector />
        </ControlCluster>
      </div>
    </ChannelControlsLayout>
  </LabelBox>
);
