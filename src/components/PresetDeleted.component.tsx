import React from 'react';
import {
  Box,
  Text,
  HoverButton,
} from './design-system';

type DismissibleMessageProps = {
  onDismiss: () => void;
};

export const PresetDeleted = ({ onDismiss }: DismissibleMessageProps) => (
  <Box>
    <Text
      fontWeight="400"
      color="nearBlack"
      fontSize={2}
      mb={3}
    >
      User preset deleted.
    </Text>
    <Box display="flex" justifyContent="flex-end">
      <HoverButton
        bg="blue"
        hoverBg="darkBlue"
        onClick={onDismiss}
        width="7rem"
        color="white"
        display="block"
        py={2}
      >
        OK
      </HoverButton>
    </Box>
  </Box>
);
