import React from 'react';
import { Box, HoverButton, Text } from './design-system';

type KitTransferMessageProps = {
  message: string;
  onDismiss: () => void;
};

const KitTransferMessage = ({ message, onDismiss }: KitTransferMessageProps) => (
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

export const KitExported = ({ onDismiss }: DismissibleMessageProps) => (
  <KitTransferMessage message="Kit exported." onDismiss={onDismiss} />
);

export const KitImported = ({ onDismiss }: DismissibleMessageProps) => (
  <KitTransferMessage message="Kit imported and selected." onDismiss={onDismiss} />
);

export const KitTransferError = ({ onDismiss }: DismissibleMessageProps) => (
  <KitTransferMessage
    message="The kit could not be imported or exported. The file may be invalid or incomplete."
    onDismiss={onDismiss}
  />
);
