import React from 'react';
import { connect } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/globalStyles';
import {
  Box,
  PatternChannelList,
  PatternChannelHeader,
  PatternWorkspaceControls,
  KitChannelHeader,
  KitWorkspaceControls,
  SongWorkspaceControls,
  MasterControls,
  WorkspaceNav,
  Branding,
  GithubLink,
  FlashMessage,
  AppMenu,
  WorkspacePanel,
} from '.';
import { selectedWorkspaceSelector, WORKSPACES } from '../common/workspace';
import { selectedThemeSelector } from '../common/uiPreferences';
import type { Workspace } from '../common/workspace';
import type { AppTheme } from '../styles/theme';
import type { RootState } from '../reducer';

type AppComponentProps = {
  selectedTheme: AppTheme;
  selectedWorkspace: Workspace;
};

const WorkspaceHeaderControls = styled.div`
  align-items: center;
  column-gap: 1rem;
  display: grid;
  grid-template-areas: "transport workspace nav";
  grid-template-columns: auto minmax(18rem, 1fr) auto;
  row-gap: 0.75rem;

  .workspace-header-transport {
    grid-area: transport;
    justify-self: start;
  }

  .workspace-header-workspace {
    grid-area: workspace;
    min-width: 0;
  }

  .workspace-header-nav {
    grid-area: nav;
    justify-self: end;
  }

  @media (max-width: 1024px) {
    grid-template-areas:
      "nav"
      "transport"
      "workspace";
    grid-template-columns: 1fr;

    .workspace-header-nav,
    .workspace-header-transport,
    .workspace-header-workspace {
      justify-self: center;
    }

    .workspace-header-workspace {
      width: 100%;
    }
  }
`;

const renderWorkspaceControls = (selectedWorkspace: Workspace) => {
  if (selectedWorkspace === WORKSPACES.PATTERN) {
    return <PatternWorkspaceControls />;
  }

  if (selectedWorkspace === WORKSPACES.KIT) {
    return <KitWorkspaceControls />;
  }

  return <SongWorkspaceControls />;
};

const AppComponent = ({ selectedTheme, selectedWorkspace }: AppComponentProps) => (
  <ThemeProvider theme={selectedTheme}>
    <>
      <GlobalStyles />
      <Box
        className="App"
        position="relative"
        p={[0, 0, 0, 1, 2, 2, 2, 3, 5]}
        pt={[4, 4, 4, 4, 4, 4, 4, 4, 5]}
      >
        <header>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Branding />
            <Box ml={2}>
              <AppMenu />
            </Box>
          </Box>
        </header>
        <main>
          <Box position="sticky" bg="surfaceApp" top="0" zIndex="10" pt={2}>
            <WorkspaceHeaderControls>
              <div className="workspace-header-transport">
                <MasterControls />
              </div>
              <div className="workspace-header-workspace">
                {renderWorkspaceControls(selectedWorkspace)}
              </div>
              <div className="workspace-header-nav">
                <WorkspaceNav />
              </div>
            </WorkspaceHeaderControls>
            {selectedWorkspace === WORKSPACES.PATTERN && (
              <PatternChannelHeader />
            )}
            {selectedWorkspace === WORKSPACES.KIT && (
              <Box mt={3}>
                <KitChannelHeader />
              </Box>
            )}
          </Box>
          {selectedWorkspace === WORKSPACES.PATTERN ? <PatternChannelList /> : <WorkspacePanel />}
        </main>
        <footer>
          <Box position="absolute" bottom={0} right={0} mr={[0, 0, 0, 1, 2, 2, 2, 3, 5]}>
            <GithubLink />
          </Box>
        </footer>
        <FlashMessage />
      </Box>
    </>
  </ThemeProvider>
);

const mapStateToProps = (state: RootState) => ({
  selectedTheme: selectedThemeSelector(state),
  selectedWorkspace: selectedWorkspaceSelector(state),
});

export default connect(mapStateToProps)(AppComponent);
