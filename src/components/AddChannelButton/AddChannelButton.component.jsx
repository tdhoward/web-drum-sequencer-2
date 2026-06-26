import React from 'react';
import PropTypes from 'prop-types';
import { HoverButton } from '../design-system';

export const AddChannelButtonComponent = ({ newChannel }) => (
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

AddChannelButtonComponent.propTypes = {
  newChannel: PropTypes.func.isRequired,
};
