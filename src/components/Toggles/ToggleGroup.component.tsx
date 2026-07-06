import React from 'react';
import type { ReactNode } from 'react';
import { Box } from '../design-system';

type ToggleGroupProps = {
  children: ReactNode;
};

export const ToggleGroup = ({ children }: ToggleGroupProps) => (
  <Box
    bg="sequencerGroupBackground"
    p={[2, 2, 2, 2, 2, 3]}
    borderRadius="3em"
    flex="1 1 auto"
    mr={[2, 2, 2, 2, 2, 3]}
    display="flex"
    justifyContent="space-between"
    alignItems="center"
  >
    {children}
  </Box>
);
