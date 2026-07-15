import React, { useState } from 'react';
import styled from 'styled-components';
import { PresetSelector } from '../PresetSelector';
import { SampleManagerModal } from '../SampleManagerModal';
import { WorkspaceControls } from '../WorkspaceControls';

const KitActionButton = styled.button`
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
      <WorkspaceControls>
        <PresetSelector label="KIT PRESET" />
        <KitActionButton
          onClick={() => setIsSampleManagerOpen(true)}
          type="button"
        >
          Manage Samples
        </KitActionButton>
      </WorkspaceControls>
      <SampleManagerModal
        onClose={() => setIsSampleManagerOpen(false)}
        show={isSampleManagerOpen}
      />
    </>
  );
};
