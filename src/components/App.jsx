import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../styles/globalStyles';
import {
  Box,
  PatternChannelList,
  PatternChannelHeader,
  PatternWorkspaceControls,
  KitChannelHeader,
  KitWorkspaceControls,
  MasterControls,
  Branding,
  GithubLink,
  FlashMessage,
  AppMenu,
  WorkspacePanel,
} from '.';
import { selectedWorkspaceSelector, WORKSPACES } from '../common/workspace';
import { selectedThemeSelector } from '../common/uiPreferences';

const AppComponent = ({ selectedTheme, selectedWorkspace }) => (
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
            <MasterControls />
            {selectedWorkspace === WORKSPACES.PATTERN && (
              <>
                <PatternWorkspaceControls />
                <PatternChannelHeader />
              </>
            )}
            {selectedWorkspace === WORKSPACES.KIT && (
              <>
                <KitWorkspaceControls />
                <Box mt={3}>
                  <KitChannelHeader />
                </Box>
              </>
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


AppComponent.propTypes = {
  selectedTheme: PropTypes.object.isRequired,
  selectedWorkspace: PropTypes.oneOf(Object.values(WORKSPACES)).isRequired,
};

const mapStateToProps = state => ({
  selectedTheme: selectedThemeSelector(state),
  selectedWorkspace: selectedWorkspaceSelector(state),
});

export default connect(mapStateToProps)(AppComponent);
