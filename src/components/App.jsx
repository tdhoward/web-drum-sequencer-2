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
  KitChannelHeader,
  KitWorkspaceControls,
  MasterControls,
  PatternPackSelector,
  Branding,
  GithubLink,
  FlashMessage,
  InstallButton,
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
            <Box ml={2}>
              <InstallButton />
            </Box>
          </Box>
        </header>
        <main>
          <Box position="sticky" bg="nearBlack" top="0" zIndex="10" pt={2}>
            <MasterControls />
            {selectedWorkspace === WORKSPACES.PATTERN && (
              <>
                <Box mb={3} width={['100%', '18rem']}>
                  <PatternPackSelector />
                </Box>
                <ChannelControls />
                <ChannelHeader />
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
