import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {
  Box,
  Label,
  TextInput,
  Button,
} from '../design-system';

const ShinyBox = styled(Box)`
  background: ${({ theme }) => theme.colors.bpmControlBackground};
  transition: border-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const BPMButton = styled(Button)`
  &:active {
    background-color: ${({ theme }) => theme.colors.bpmControlButtonActiveBackground};
  }
`;

export const BPMInputComponent = ({ bpm, setBPM }) => (
  <ShinyBox
    display="flex"
    border="2px solid"
    borderColor="borderDefault"
    borderRadius="0.5rem"
    position="relative"
  >
    <Label
      position="absolute"
      left="0.5rem"
      top="-0.6em"
      color="textMuted"
      fontSize="0.6rem"
      fontWeight="600"
      bg="surfaceApp"
      pl={1}
      pr={1}
      borderRadius="3px"
      letterSpacing="0.1em"
      htmlFor="bpm"
    >
      BPM
    </Label>
    <TextInput
      min="1"
      max="999"
      flex="1 1 auto"
      position="relative"
      zIndex={1}
      width="3rem"
      height="100%"
      pl="0.7rem"
      fontSize="1.5rem"
      lineHeight="1em"
      fontWeight="500"
      bg="transparent"
      id="bpm"
      color="bpmControlText"
      className="bpm-text-input"
      type="number"
      value={bpm}
      onChange={(e) => {
        setBPM(parseInt(e.target.value, 10));
      }}
    />
    <Box display="flex" flexDirection="column">
      <BPMButton
        color="bpmControlButtonText"
        bg="transparent"
        p={0}
        flex="auto"
        width="2rem"
        borderRadius="0 0.5rem 0 0"
        onClick={() => {
          setBPM(bpm + 1);
        }}
        aria-label="Increase beat per minute"
      >
        <svg width="10px" height="6px" viewBox="0 0 12 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
          <polygon points="0 7 12 7 6 0" fill="currentColor" />
        </svg>
      </BPMButton>
      <BPMButton
        color="bpmControlButtonText"
        bg="transparent"
        p={0}
        flex="auto"
        width="2rem"
        borderRadius="0 0 0.5rem 0"
        onClick={() => {
          setBPM(bpm - 1);
        }}
        aria-label="Decrease beat per minute"
      >
        <svg width="10px" height="6px" viewBox="0 0 12 7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
          <polygon points="0 0 12 0 6 7" fill="currentColor" />
        </svg>
      </BPMButton>
    </Box>
  </ShinyBox>
);

BPMInputComponent.propTypes = {
  bpm: PropTypes.number.isRequired,
  setBPM: PropTypes.func.isRequired,
};
