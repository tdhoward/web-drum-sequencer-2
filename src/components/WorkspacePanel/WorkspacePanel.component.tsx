import React from 'react';
import type { ReactNode } from 'react';
import { Box, Text } from '../design-system';
import { KitChannelList } from '../KitChannelList';
import { WORKSPACES } from '../../common/workspace';
import type { Workspace } from '../../common/workspace';

type WorkspacePlaceholderProps = {
  title: string;
  body: string;
  children?: ReactNode;
};

type WorkspacePanelComponentProps = {
  selectedWorkspace: Workspace;
};

const WorkspacePlaceholder = ({
  title,
  body,
  children = null,
}: WorkspacePlaceholderProps) => (
  <Box
    bg="surfacePanel"
    border="1px solid"
    borderColor="borderDefault"
    borderRadius="0.5rem"
    mt={3}
    p={[3, 3, 4]}
  >
    <Text color="textPrimary" fontSize={3} fontWeight="bold" lineHeight="1.2em" mb={2}>
      {title}
    </Text>
    <Text color="textSecondary" fontSize={2} lineHeight="1.5em" mb={children ? 3 : 0}>
      {body}
    </Text>
    {children}
  </Box>
);

const KitWorkspacePanel = () => (
  <Box mt={2}>
    <KitChannelList />
  </Box>
);

const SongWorkspacePanel = () => (
  <WorkspacePlaceholder
    title="Song workspace"
    body="Song and arrangement editing will go here."
  />
);

export const WorkspacePanelComponent = ({
  selectedWorkspace,
}: WorkspacePanelComponentProps) => {
  if (selectedWorkspace === WORKSPACES.KIT) {
    return <KitWorkspacePanel />;
  }

  if (selectedWorkspace === WORKSPACES.SONG) {
    return <SongWorkspacePanel />;
  }

  return null;
};
