import React, {
  useEffect,
  useRef,
} from 'react';
import styled from 'styled-components';
import {
  Box,
  Label,
  TextInput,
  Button,
} from '../design-system';
import { getAudioContext, getCurrentBeat } from '../../services/audioContext';

const PULSE_DECAY_BEATS = 0.24;

const ShinyBox = styled(Box)`
  --bpm-pulse-glow: ${({ theme }) => theme.colors.accentPrimaryGlow};
  --bpm-pulse-outer-glow: 0;
  --bpm-pulse-inner-glow: 0;

  background: ${({ theme }) => theme.colors.bpmControlBackground};
  box-shadow:
    0 0 var(--bpm-pulse-outer-glow) var(--bpm-pulse-glow),
    inset 0 0 var(--bpm-pulse-inner-glow) var(--bpm-pulse-glow);
  transition:
    border-color 0.2s,
    box-shadow 40ms linear;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderHover};
  }
`;

const BPMButton = styled(Button)`
  &:active {
    background-color: ${({ theme }) => theme.colors.bpmControlButtonActiveBackground};
  }
`;

type BPMInputComponentProps = {
  bpm: number;
  playing: boolean;
  startTime: number | null;
  setBPM: (bpm: number) => void;
};

const clearTempoPulse = (control: HTMLDivElement): void => {
  control.style.setProperty('--bpm-pulse-outer-glow', '0');
  control.style.setProperty('--bpm-pulse-inner-glow', '0');
};

const getBeatPhase = (
  bpm: number,
  startTime: number,
  currentTime: number,
): number => {
  const currentBeat = getCurrentBeat(bpm, startTime, currentTime);
  return (((currentBeat - 1) % 1) + 1) % 1;
};

const drawTempoPulse = (
  control: HTMLDivElement,
  bpm: number,
  startTime: number,
  currentTime: number,
): void => {
  const phase = getBeatPhase(bpm, startTime, currentTime);
  const pulse = Math.max(0, 1 - (phase / PULSE_DECAY_BEATS));

  control.style.setProperty('--bpm-pulse-outer-glow', `${pulse > 0 ? 3 + pulse * 12 : 0}px`);
  control.style.setProperty('--bpm-pulse-inner-glow', `${pulse > 0 ? 1 + pulse * 7 : 0}px`);
};

export const BPMInputComponent = ({
  bpm,
  playing,
  startTime,
  setBPM,
}: BPMInputComponentProps) => {
  const controlRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrame: number | null = null;

    const draw = () => {
      const control = controlRef.current;

      if (!control) {
        return;
      }

      if (!playing || startTime === null || !Number.isFinite(bpm) || bpm <= 0) {
        clearTempoPulse(control);
        return;
      }

      const currentTime = getAudioContext().currentTime;

      if (currentTime < startTime) {
        clearTempoPulse(control);
      } else {
        drawTempoPulse(control, bpm, startTime, currentTime);
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [bpm, playing, startTime]);

  return (
    <ShinyBox
      ref={controlRef}
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
};
