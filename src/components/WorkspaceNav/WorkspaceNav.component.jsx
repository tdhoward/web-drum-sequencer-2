import React from 'react';
import PropTypes from 'prop-types';
import { Box, HoverButton } from '../design-system';
import { WORKSPACES } from '../../common/workspace';

const workspaceOptions = [
  { id: WORKSPACES.PATTERN, label: 'Pattern' },
  { id: WORKSPACES.KIT, label: 'Kit' },
  { id: WORKSPACES.SONG, label: 'Song' },
];

export const WorkspaceNavComponent = ({ selectedWorkspace, setSelectedWorkspace }) => (
  <Box
    aria-label="Workspace"
    display="flex"
    bg="darkGray"
    borderRadius="0.35rem"
    p="0.25rem"
    role="tablist"
  >
    {workspaceOptions.map((workspace, index) => {
      const isSelected = selectedWorkspace === workspace.id;

      return (
        <Box key={workspace.id} ml={index === 0 ? 0 : 1}>
          <HoverButton
            aria-selected={isSelected}
            bg={isSelected ? 'primary' : 'transparent'}
            color={isSelected ? 'nearBlack' : 'nearWhite'}
            hoverBg={isSelected ? 'primary' : 'steel'}
            hoverColor={isSelected ? 'nearBlack' : 'white'}
            minWidth="4.75rem"
            onClick={() => setSelectedWorkspace(workspace.id)}
            p="0.6rem 0.8rem"
            role="tab"
            transitionSpeed="0.2s"
            width="auto"
          >
            {workspace.label}
          </HoverButton>
        </Box>
      );
    })}
  </Box>
);

WorkspaceNavComponent.propTypes = {
  selectedWorkspace: PropTypes.oneOf(Object.values(WORKSPACES)).isRequired,
  setSelectedWorkspace: PropTypes.func.isRequired,
};
