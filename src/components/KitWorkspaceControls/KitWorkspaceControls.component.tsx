import React, { useState } from 'react';
import styled from 'styled-components';
import { Text } from '../design-system';
import { LabelBox } from '../LabelBox';
import { PresetSelector } from '../PresetSelector';
import { SampleManagerModal } from '../SampleManagerModal';

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
    flex: 0 1 24rem;
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

const LocalControls = styled.div`
  align-items: flex-end;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(12rem, 1fr) auto;

  @media (max-width: 640px) {
    align-items: stretch;
    grid-template-columns: 1fr;
  }
`;

const ManageSamplesButton = styled.button`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.25rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
  min-height: 3rem;
  padding: 0.65rem 0.8rem;

  &:hover, &:focus-visible {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

export const KitWorkspaceControls = () => {
  const [isSampleManagerOpen, setIsSampleManagerOpen] = useState(false);

  return (
    <LabelBox label="KIT CONTROLS">
      <WorkspaceControlLayout>
        <div className="workspace-control-copy">
          <Text color="textSecondary" fontSize={2} lineHeight="1.5em">
            Select the active kit preset, edit channel samples, and manage saved user samples.
          </Text>
        </div>
        <div className="workspace-local-control">
          <LocalControls>
            <PresetSelector label="KIT PRESET" />
            <ManageSamplesButton
              onClick={() => setIsSampleManagerOpen(true)}
              type="button"
            >
              Manage Samples
            </ManageSamplesButton>
          </LocalControls>
        </div>
      </WorkspaceControlLayout>
      <SampleManagerModal
        onClose={() => setIsSampleManagerOpen(false)}
        show={isSampleManagerOpen}
      />
    </LabelBox>
  );
};
