import React from 'react';
import { Box } from '../design-system';
import { KitChannelList } from '../KitChannelList';
import { SongSequencer } from '../SongSequencer';
import { WORKSPACES } from '../../common/workspace';
import type { Workspace } from '../../common/workspace';

type WorkspacePanelComponentProps = {
  selectedWorkspace: Workspace;
};

const KitWorkspacePanel = () => (
  <Box mt={2}>
    <KitChannelList />
  </Box>
);

const SongWorkspacePanel = () => <SongSequencer />;

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
