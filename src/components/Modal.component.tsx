import React, { type ReactNode } from 'react';
import { Box } from './design-system';

type ModalProps = {
  children: ReactNode;
  show: boolean;
};

export const Modal = ({ children, show }: ModalProps) => (
  <Box
    position="fixed"
    left={0}
    top={0}
    width="100%"
    height="100%"
    bg="surfaceOverlay"
    display={show ? 'flex' : 'none'}
    zIndex={99}
    justifyContent="center"
    alignItems="center"
  >
    {children}
  </Box>
);
