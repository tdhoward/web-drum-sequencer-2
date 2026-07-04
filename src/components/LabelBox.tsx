import React, { type ReactNode } from 'react';
import styled from 'styled-components';
import { Box, Text, type BoxProps } from './design-system';

type HoverBoxProps = BoxProps & {
  hoverEffect: boolean;
};

type LabelBoxProps = {
  label: string;
  children: ReactNode;
  hoverEffect?: boolean;
};

const HoverBox = styled(Box)<HoverBoxProps>`
  transition: border-color 0.2s;

  &:hover {
    ${({ hoverEffect, theme }) => (
    hoverEffect
      ? `border-color: ${theme.colors.borderHover};`
      : '')}
  }
`;

export const LabelBox = ({
  label,
  children,
  hoverEffect = false,
}: LabelBoxProps) => (
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
