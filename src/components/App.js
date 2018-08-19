import React from 'react';
import { ThemeProvider } from 'styled-components';
import theme from '../styles/theme';
import globalStyles from '../styles/globalStyles';
import '../styles/index.css';
import {
  Box,
  Line,
  ChannelList,
  ChannelHeader,
  MasterControls,
  Logo,
} from '.';

globalStyles();

const App = () => (
  <ThemeProvider theme={theme}>
    <Box className="App" p={[0, 0, 0, 1, 2, 2, 2, 3, 5]} pt={[4, 4, 4, 4, 4, 4, 4, 4, 5]}>
      <Logo color="white" width="200px" />
      <Line bg="lightGray" mb={4} mt={4} />
      <MasterControls />
      <ChannelHeader />
      <ChannelList />
    </Box>
  </ThemeProvider>
);

export default App;
