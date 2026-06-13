import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ThemeProvider } from 'styled-components';
import theme from '../styles/theme';
import GlobalStyles from '../styles/globalStyles';
import {
  Box,
  ChannelList,
  ChannelHeader,
  ChannelControls,
  MasterControls,
  Branding,
  GithubLink,
  FlashMessage,
  InstallButton,
  WorkspaceNav,
  WorkspacePanel,
} from '.';
import { selectedWorkspaceSelector, WORKSPACES } from '../common/workspace';

const AppComponent = ({ selectedWorkspace }) => (
  <ThemeProvider theme={theme}>
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
            <Box display="flex" alignItems="flex-start">
              <WorkspaceNav />
              <Box ml={2}>
                <InstallButton />
              </Box>
            </Box>
          </Box>
        </header>
        <main>
          <Box position="sticky" bg="nearBlack" top="0" zIndex="10" pt={2}>
            <MasterControls />
            {selectedWorkspace === WORKSPACES.PATTERN && (
              <>
                <ChannelControls />
                <ChannelHeader />
              </>
            )}
          </Box>
          {selectedWorkspace === WORKSPACES.PATTERN ? <ChannelList /> : <WorkspacePanel />}
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
  selectedWorkspace: PropTypes.oneOf(Object.values(WORKSPACES)).isRequired,
};

const mapStateToProps = state => ({
  selectedWorkspace: selectedWorkspaceSelector(state),
});

export default connect(mapStateToProps)(AppComponent);
