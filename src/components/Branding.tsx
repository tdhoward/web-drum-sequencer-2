import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Logo } from './Logo.component';
import { Box } from './design-system';

const HeaderText = styled.h1`
  color: ${({ theme }) => theme.colors.borderDefault};
  font-size: 1em;
  font-weight: 600;
  margin-left: 1.5em;
  line-height: 1.2em;
  margin-top: 0.5em;
  max-width: 4em;
`;

export const Branding = () => {
  const theme = useTheme();
  const logoColor = theme.colors.brandLogo || theme.colors.surfaceInverse;

  return (
    <Box mb={4} display="flex" alignItems="center">
      <Logo color={logoColor} width="200px" />
      <HeaderText>
        Web Drum Sequencer
      </HeaderText>
    </Box>
  );
};
