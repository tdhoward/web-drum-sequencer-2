import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Text } from '../design-system';
import { LabelBox } from '../LabelBox';
import { CurrentKitDisplay } from '../CurrentKitDisplay';
import { KitChannelControls } from '../KitChannelControls';
import { WORKSPACES } from '../../common/workspace';

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

const WorkspacePlaceholder = ({ title, body, children }) => (
  <Box
    bg="nearBlack"
    border="1px solid"
    borderColor="steel"
    borderRadius="0.5rem"
    mt={3}
    p={[3, 3, 4]}
  >
    <Text color="nearWhite" fontSize={3} fontWeight="bold" lineHeight="1.2em" mb={2}>
      {title}
    </Text>
    <Text color="lightGray" fontSize={2} lineHeight="1.5em" mb={children ? 3 : 0}>
      {body}
    </Text>
    {children}
  </Box>
);

WorkspacePlaceholder.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  children: PropTypes.node,
};

WorkspacePlaceholder.defaultProps = {
  children: null,
};

const KitWorkspacePanel = () => (
  <Box mt={2}>
    <KitChannelControls />
  </Box>
);

const SongWorkspacePanel = () => (
  <WorkspacePlaceholder
    title="Song workspace"
    body="Song and arrangement editing will go here."
  >
    <LabelBox label="SONG CONTROLS">
      <WorkspaceControlLayout>
        <div className="workspace-control-copy">
          <Text color="lightGray" fontSize={2} lineHeight="1.5em">
            Arrangement controls will be added here. The current kit is shown for context
            while the song workspace is active.
          </Text>
        </div>
        <div className="workspace-local-control">
          <CurrentKitDisplay />
        </div>
      </WorkspaceControlLayout>
    </LabelBox>
  </WorkspacePlaceholder>
);

export const WorkspacePanelComponent = ({ selectedWorkspace }) => {
  if (selectedWorkspace === WORKSPACES.KIT) {
    return <KitWorkspacePanel />;
  }

  if (selectedWorkspace === WORKSPACES.SONG) {
    return <SongWorkspacePanel />;
  }

  return null;
};

WorkspacePanelComponent.propTypes = {
  selectedWorkspace: PropTypes.oneOf(Object.values(WORKSPACES)).isRequired,
};
