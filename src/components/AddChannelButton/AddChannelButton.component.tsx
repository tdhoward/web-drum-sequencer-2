import React from 'react';
import { HoverButton } from '../design-system';

type AddChannelButtonComponentProps = {
  newChannel: () => void;
};

export const AddChannelButtonComponent = ({
  newChannel,
}: AddChannelButtonComponentProps) => (
  <HoverButton
    onClick={() => newChannel()}
    width="16rem"
    bg="surfacePanelRaised"
    color="textMuted"
    hoverColor="textPrimary"
    hoverBg="surfaceControlHover"
    transitionSpeed="0.2s"
    ml={1}
    mt={2}
    py="1rem"
  >
    Add Channel +
  </HoverButton>
);
