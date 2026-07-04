import React from 'react';
import styled from 'styled-components';
import { Text } from '../design-system';
import { LabelBox } from '../LabelBox';
import { PresetSelector } from '../PresetSelector';

const WorkspaceControlLayout = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;

  .workspace-control-copy {
    flex: 1 1 18rem;
  }

  .workspace-local-control {
    flex: 0 1 15rem;
    margin-left: auto;
    min-height: 3rem;
  }

  @media (max-width: 720px) {
    .workspace-local-control {
      flex-basis: 100%;
      margin-left: 0;
    }
  }
`;

export const KitWorkspaceControls = () => (
  <LabelBox label="KIT CONTROLS">
    <WorkspaceControlLayout>
      <div className="workspace-control-copy">
        <Text color="textSecondary" fontSize={2} lineHeight="1.5em">
          Select the active kit preset here for now. Dedicated kit naming, channel sample
          editing, and kit duplication controls will be added later.
        </Text>
      </div>
      <div className="workspace-local-control">
        <PresetSelector label="KIT PRESET" />
      </div>
    </WorkspaceControlLayout>
  </LabelBox>
);
