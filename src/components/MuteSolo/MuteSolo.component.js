import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Text } from '../design-system';

const MSButton = Button.extend`
  width: 0.9rem;
  height: 0.9rem;
  padding: 0;
  border-radius: 100%;
  transition: all 0.1s;
`;

const MSText = Text.extend`
  font-weight: 500;
  font-size: 0.6rem;
  margin: 1px 1px 0 0;
`;

export const MuteSoloComponent = ({ onPressMuted, onPressSolo, channel }) => (
  <Box
    justifyContent="space-around"
    width="1.2rem"
    display="flex"
    ml={2}
    height="100%"
    flexDirection="column"
  >
    <MSButton
      bg={channel.solo ? 'yellow' : 'yellow30'}
      onClick={onPressSolo}
    >
      <MSText
        color={channel.solo ? 'black' : 'white'}
      >
        S
      </MSText>
    </MSButton>
    <MSButton
      bg={channel.muted ? 'brightRed' : 'brightRed30'}
      onClick={onPressMuted}
    >
      <MSText
        color={channel.muted ? 'black' : 'white'}
      >
        M
      </MSText>
    </MSButton>

  </Box>
);

MuteSoloComponent.propTypes = {
  onPressMuted: PropTypes.func.isRequired,
  onPressSolo: PropTypes.func.isRequired,
  channel: PropTypes.shape({
    solo: PropTypes.bool,
    muted: PropTypes.bool,
  }).isRequired,
};
