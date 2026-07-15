import React from 'react';
import { Box, HoverButton, Text } from './design-system';

export const SongDeleted = ({ onDismiss }: { onDismiss: () => void }) => (
  <Box>
    <Text fontWeight="400" color="nearBlack" fontSize={2} mb={3}>User song deleted.</Text>
    <Box display="flex" justifyContent="flex-end">
      <HoverButton bg="blue" hoverBg="darkBlue" onClick={onDismiss} width="7rem" color="white" py={2}>OK</HoverButton>
    </Box>
  </Box>
);
