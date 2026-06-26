import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Box, Text } from './design-system';

const HoverBox = styled(Box)`
  transition: border-color 0.2s;

  &:hover {
    ${({ hoverEffect, theme }) => (
    hoverEffect
      ? `border-color: ${theme.colors.borderHover};`
      : '')}
  }
`;

export const LabelBox = ({ label, children, hoverEffect = false }) => (
  <HoverBox
    display="flex"
    border="2px solid"
    borderColor="borderDefault"
    borderRadius="0.5rem"
    p={2}
    position="relative"
    alignItems="center"
    hoverEffect={hoverEffect}
  >
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
      borderRadius="3px"
    >
      {label}
    </Text>
    {children}
  </HoverBox>
);

LabelBox.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  hoverEffect: PropTypes.bool,
};

