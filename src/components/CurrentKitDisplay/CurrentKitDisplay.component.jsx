import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box, Text } from '../design-system';

const CurrentKitFrame = styled(Box)`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 2px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.5em;
  min-height: 2.7rem;
  overflow: hidden;
`;

export const CurrentKitDisplayComponent = ({ kitName }) => (
  <Box height="100%" minWidth="11rem" position="relative">
    <Text
      position="absolute"
      left="0.5rem"
      top="-0.6em"
      color="textMuted"
      fontSize="0.6rem"
      fontWeight="600"
      bg="surfaceApp"
      pl={1}
      pr={1}
      letterSpacing="0.1em"
      zIndex={1}
      borderRadius="3px"
    >
      CURRENT KIT
    </Text>
    <CurrentKitFrame display="flex" alignItems="center" px={3}>
      <Text color="textPrimary" fontSize={2} lineHeight="1.2em">
        {kitName}
      </Text>
    </CurrentKitFrame>
  </Box>
);

CurrentKitDisplayComponent.propTypes = {
  kitName: PropTypes.string.isRequired,
};
