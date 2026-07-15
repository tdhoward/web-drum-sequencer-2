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
import { getAudioContext } from '../../services/audioContext';

const PULSE_DECAY_BEATS = 0.24;

const ShinyBox = styled(Box)`
  --bpm-pulse-glow: ${({ theme }) => theme.colors.accentPrimaryGlow};
  --bpm-pulse-outer-glow: 0;
  --bpm-pulse-inner-glow: 0;
  --bpm-downbeat-fill-opacity: 0;

  background: ${({ theme }) => theme.colors.bpmControlBackground};
  box-shadow:
    0 0 var(--bpm-pulse-outer-glow) var(--bpm-pulse-glow),
    inset 0 0 var(--bpm-pulse-inner-glow) var(--bpm-pulse-glow);
  transition:
    border-color 0.2s,
    box-shadow 40ms linear;

  &::before {
    background: ${({ theme }) => theme.colors.accentPrimaryGlow};
    border-radius: 0.38rem 0 0 0.38rem;
    bottom: 0;
    content: '';
    left: 0;
    opacity: var(--bpm-downbeat-fill-opacity);
    pointer-events: none;
    position: absolute;
    right: 2rem;
    top: 0;
    transition: opacity 40ms linear;
  }

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
  barLengthInBeats: number;
  bpm: number;
  playing: boolean;
  startTime: number | null;
  setBPM: (bpm: number) => void;
};

const clearTempoPulse = (control: HTMLDivElement): void => {
  control.style.setProperty('--bpm-pulse-outer-glow', '0');
  control.style.setProperty('--bpm-pulse-inner-glow', '0');
  control.style.setProperty('--bpm-downbeat-fill-opacity', '0');
};

type TempoPulseState = {
  downbeat: boolean;
  pulse: number;
};

const positiveModulo = (value: number, divisor: number): number => (
  ((value % divisor) + divisor) % divisor
);

export const getTempoPulseState = (
  bpm: number,
  startTime: number,
  currentTime: number,
  barLengthInBeats: number,
): TempoPulseState => {
  const elapsedBeats = (currentTime - startTime) * (bpm / 60);
  const beatPhase = positiveModulo(elapsedBeats, 1);
  const safeBarLength = Number.isFinite(barLengthInBeats) && barLengthInBeats > 0
    ? barLengthInBeats
    : 4;
  const barPhase = positiveModulo(elapsedBeats, safeBarLength);
  const beatPulse = Math.max(0, 1 - (beatPhase / PULSE_DECAY_BEATS));
  const downbeatPulse = Math.max(0, 1 - (barPhase / PULSE_DECAY_BEATS));

  return {
    downbeat: downbeatPulse > 0,
    pulse: Math.max(beatPulse, downbeatPulse),
  };
};

const drawTempoPulse = (
  control: HTMLDivElement,
  bpm: number,
  startTime: number,
  currentTime: number,
  barLengthInBeats: number,
): void => {
  const { downbeat, pulse } = getTempoPulseState(
    bpm,
    startTime,
    currentTime,
    barLengthInBeats,
  );
  const outerGlow = downbeat ? 6 + pulse * 21 : 3 + pulse * 12;
  const innerGlow = downbeat ? 3 + pulse * 11 : 1 + pulse * 7;

  control.style.setProperty('--bpm-pulse-outer-glow', `${pulse > 0 ? outerGlow : 0}px`);
  control.style.setProperty('--bpm-pulse-inner-glow', `${pulse > 0 ? innerGlow : 0}px`);
  control.style.setProperty(
    '--bpm-downbeat-fill-opacity',
    `${downbeat ? pulse * 0.58 : 0}`,
  );
};

export const BPMInputComponent = ({
  barLengthInBeats,
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
        drawTempoPulse(control, bpm, startTime, currentTime, barLengthInBeats);
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [barLengthInBeats, bpm, playing, startTime]);

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
