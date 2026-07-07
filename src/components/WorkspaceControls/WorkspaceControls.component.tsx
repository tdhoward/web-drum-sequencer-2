import React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { LabelBox } from '../LabelBox';
import { Text } from '../design-system';

type WorkspaceControlsLayoutProps = {
  $hasDescription: boolean;
  $controlsWidth: string;
};

type WorkspaceControlsProps = {
  children: ReactNode;
  description?: ReactNode;
  controlsWidth?: string;
  label: string;
};

const WorkspaceControlsLayout = styled.div<WorkspaceControlsLayoutProps>`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.3rem 0.4rem;
  width: 100%;

  .workspace-controls-description {
    flex: 1 1 18rem;
  }

  .workspace-controls-actions {
    align-items: center;
    display: flex;
    flex: ${({ $controlsWidth, $hasDescription }) => (
    $hasDescription ? `0 1 ${$controlsWidth}` : '1 1 100%'
  )};
    flex-wrap: wrap;
    gap: 0.65rem;
    justify-content: ${({ $hasDescription }) => ($hasDescription ? 'flex-end' : 'center')};
    margin-left: auto;
    min-height: 3rem;
  }

  @media (max-width: 720px) {
    .workspace-controls-actions {
      flex-basis: 100%;
      justify-content: flex-start;
      margin-left: 0;
    }
  }
`;

export const WorkspaceControls = ({
  children,
  description,
  controlsWidth = '24rem',
  label,
}: WorkspaceControlsProps) => (
  <LabelBox label={label}>
    <WorkspaceControlsLayout
      $controlsWidth={controlsWidth}
      $hasDescription={Boolean(description)}
    >
      {description && (
        <div className="workspace-controls-description">
          {typeof description === 'string' ? (
            <Text color="textSecondary" fontSize={2} lineHeight="1.5em">
              {description}
            </Text>
          ) : description}
        </div>
      )}
      <div className="workspace-controls-actions">
        {children}
      </div>
    </WorkspaceControlsLayout>
  </LabelBox>
);
