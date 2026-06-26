import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { WORKSPACES } from '../../common/workspace';

const workspaceOptions = [
  { id: WORKSPACES.KIT, label: 'Kit' },
  { id: WORKSPACES.PATTERN, label: 'Pattern' },
  { id: WORKSPACES.SONG, label: 'Song' },
];

const WorkspaceTrack = styled.div`
  align-items: center;
  background: ${({ theme }) => `linear-gradient(180deg, ${theme.colors.surfacePanelRaised}, ${theme.colors.surfacePanel})`};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: 999px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.35),
    0 0.7rem 1.4rem rgba(0, 0, 0, 0.18);
  display: flex;
  isolation: isolate;
  min-height: 2.65rem;
  min-width: 18.5rem;
  padding: 0.2rem;
`;

const WorkspaceButton = styled.button`
  align-items: center;
  background: ${({ $selected, theme }) => ($selected ? theme.colors.accentPrimary : 'transparent')};
  border: 0;
  border-radius: 999px;
  box-shadow: ${({ $selected, theme }) => ($selected
    ? `0 0 0.85rem ${theme.colors.accentPrimaryGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`
    : 'none')};
  color: ${({ $selected, theme }) => ($selected ? theme.colors.textInverse : theme.colors.textPrimary)};
  cursor: pointer;
  display: flex;
  flex: 1;
  font-size: 0.7rem;
  font-weight: bold;
  height: 2.25rem;
  justify-content: center;
  letter-spacing: 0.02em;
  min-width: 5.9rem;
  padding: 0 1rem;
  text-transform: uppercase;
  touch-action: manipulation;
  transition: background-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;

  &:hover {
    background: ${({ $selected, theme }) => ($selected ? theme.colors.accentPrimary : theme.colors.borderSubtle)};
    color: ${({ $selected, theme }) => ($selected ? theme.colors.textInverse : theme.colors.textPrimary)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 2px;
  }
`;

export const WorkspaceNavComponent = ({ selectedWorkspace, setSelectedWorkspace }) => (
  <WorkspaceTrack aria-label="Workspace" role="tablist">
    {workspaceOptions.map(workspace => {
      const isSelected = selectedWorkspace === workspace.id;

      return (
        <WorkspaceButton
          key={workspace.id}
          $selected={isSelected}
          aria-selected={isSelected}
          onClick={() => setSelectedWorkspace(workspace.id)}
          role="tab"
          type="button"
        >
          {workspace.label}
        </WorkspaceButton>
      );
    })}
  </WorkspaceTrack>
);

WorkspaceNavComponent.propTypes = {
  selectedWorkspace: PropTypes.oneOf(Object.values(WORKSPACES)).isRequired,
  setSelectedWorkspace: PropTypes.func.isRequired,
};
