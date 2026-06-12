import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Box, Text } from '../design-system';

const HeaderText = styled(Text)`
  text-transform: uppercase;
`;

export const ChannelHeaderLabel = ({ children, centerText = false, ...restProps }) => (
  <Box p={1} {...restProps}>
    <HeaderText
      color="white"
      fontWeight="700"
      fontSize="0.7rem"
      textAlign={centerText ? 'center' : 'left'}
    >
      {children}
    </HeaderText>
  </Box>
);

ChannelHeaderLabel.propTypes = {
  children: PropTypes.node.isRequired,
  centerText: PropTypes.bool,
};

