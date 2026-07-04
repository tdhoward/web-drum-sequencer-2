import React, { type ReactNode } from 'react';
import styled from 'styled-components';
import { Box, Text, type BoxProps } from './design-system';

const HeaderText = styled(Text)`
  text-transform: uppercase;
`;

type ChannelHeaderLabelLayoutProps = Pick<BoxProps, 'width' | 'mr'>;

type ChannelHeaderLabelProps = ChannelHeaderLabelLayoutProps & {
  children: ReactNode;
  centerText?: boolean;
};

export const ChannelHeaderLabel = ({
  children,
  centerText = false,
  ...restProps
}: ChannelHeaderLabelProps) => (
  <Box p={1} {...restProps}>
    <HeaderText
      color="channelHeaderText"
      fontWeight="700"
      fontSize="0.7rem"
      textAlign={centerText ? 'center' : 'left'}
    >
      {children}
    </HeaderText>
  </Box>
);
