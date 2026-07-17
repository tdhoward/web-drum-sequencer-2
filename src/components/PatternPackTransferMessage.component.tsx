import React from 'react';
import { Box, HoverButton, Text } from './design-system';

type PatternPackTransferMessageProps = {
  message: string;
  onDismiss: () => void;
};

const PatternPackTransferMessage = ({
  message,
  onDismiss,
}: PatternPackTransferMessageProps) => (
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

export const PatternPackExported = ({ onDismiss }: DismissibleMessageProps) => (
  <PatternPackTransferMessage message="Pattern pack exported." onDismiss={onDismiss} />
);

export const PatternPackImported = ({ onDismiss }: DismissibleMessageProps) => (
  <PatternPackTransferMessage
    message="Pattern pack imported and selected."
    onDismiss={onDismiss}
  />
);

export const PatternPackTransferError = ({ onDismiss }: DismissibleMessageProps) => (
  <PatternPackTransferMessage
    message={
      'The pattern pack could not be imported or exported. '
      + 'The file may be invalid or incomplete.'
    }
    onDismiss={onDismiss}
  />
);
