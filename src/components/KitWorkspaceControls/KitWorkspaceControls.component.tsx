import React, { useState } from 'react';
import styled from 'styled-components';
import { PresetSelector } from '../PresetSelector';
import { SampleManagerModal } from '../SampleManagerModal';
import { WorkspaceControls } from '../WorkspaceControls';

const LocalControls = styled.div`
  align-items: flex-end;
  display: grid;
  flex: 1 1 100%;
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
    <>
      <WorkspaceControls label="KIT CONTROLS">
        <LocalControls>
          <PresetSelector label="KIT PRESET" />
          <ManageSamplesButton
            onClick={() => setIsSampleManagerOpen(true)}
            type="button"
          >
            Manage Samples
          </ManageSamplesButton>
        </LocalControls>
      </WorkspaceControls>
      <SampleManagerModal
        onClose={() => setIsSampleManagerOpen(false)}
        show={isSampleManagerOpen}
      />
    </>
  );
};
