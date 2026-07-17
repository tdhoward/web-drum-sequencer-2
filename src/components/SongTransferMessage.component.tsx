import React from 'react';
import { Box, HoverButton, Text } from './design-system';

type SongTransferMessageProps = {
  message: string;
  onDismiss: () => void;
};

const SongTransferMessage = ({ message, onDismiss }: SongTransferMessageProps) => (
  <Box>
    <Text fontWeight="400" color="nearBlack" fontSize={2} mb={3}>
      {message}
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

type DismissibleMessageProps = {
  onDismiss: () => void;
};

export const SongExported = ({ onDismiss }: DismissibleMessageProps) => (
  <SongTransferMessage message="Song exported." onDismiss={onDismiss} />
);

export const SongImported = ({ onDismiss }: DismissibleMessageProps) => (
  <SongTransferMessage message="Song imported and selected." onDismiss={onDismiss} />
);

export const SongTransferError = ({ onDismiss }: DismissibleMessageProps) => (
  <SongTransferMessage
    message="The song could not be imported or exported. The file may be invalid or incomplete."
    onDismiss={onDismiss}
  />
);
