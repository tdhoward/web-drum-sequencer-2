import React from 'react';
import styled from 'styled-components';
import {
  DEFAULT_NOTE_VELOCITY,
  MAX_NOTE_VELOCITY,
  MIN_NOTE_VELOCITY,
} from '../../common/sequencerModel';

type NoteVelocityPopoverProps = {
  beat: number;
  velocity: number;
  onChangeVelocity: (velocity: number) => void;
  onResetVelocity: () => void;
};

const VELOCITY_STEP = 0.05;

const formatVelocity = (velocity: number): string => `${Math.round(velocity * 100)}%`;

const stopPropagation = (event: React.SyntheticEvent): void => {
  event.stopPropagation();
};

const preventContextMenu = (event: React.MouseEvent): void => {
  event.preventDefault();
  event.stopPropagation();
};

const Popover = styled.div`
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.5rem);
  z-index: 30;
  width: 3.5rem;
  min-height: 9.5rem;
  padding: 0.5rem 0.375rem;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.35rem;
  background: ${({ theme }) => theme.colors.surfacePanel};
  box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.36);
  color: ${({ theme }) => theme.colors.textPrimary};
  transform: translateX(-50%);
  box-sizing: border-box;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -0.35rem;
    width: 0.65rem;
    height: 0.65rem;
    border-right: 1px solid ${({ theme }) => theme.colors.borderDefault};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
    background: ${({ theme }) => theme.colors.surfacePanel};
    transform: translateX(-50%) rotate(45deg);
  }
`;

const VelocityReadout = styled.div`
  height: 1rem;
  font-size: 0.72rem;
  font-weight: bold;
  line-height: 1rem;
  text-align: center;
  letter-spacing: 0;
  user-select: none;
`;

const SliderSlot = styled.div`
  position: relative;
  width: 100%;
  height: 6.25rem;
  margin: 0.25rem 0;
`;

const VerticalRange = styled.input.attrs({ type: 'range' })`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 5.75rem;
  height: 1.25rem;
  margin: 0;
  accent-color: ${({ theme }) => theme.colors.accentPrimary};
  cursor: pointer;
  transform: translate(-50%, -50%) rotate(-90deg);
`;

const ResetButton = styled.button`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 1.35rem;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 0.25rem;
  background: ${({ theme }) => theme.colors.surfaceControl};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.68rem;
  font-weight: bold;
  line-height: 1;
  letter-spacing: 0;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(100, 180, 255, 0.5);
  }
`;

export const NoteVelocityPopover = ({
  beat,
  velocity,
  onChangeVelocity,
  onResetVelocity,
}: NoteVelocityPopoverProps) => {
  const velocityText = formatVelocity(velocity);

  return (
    <Popover
      className="wds-note-velocity-popover"
      role="dialog"
      aria-label={`beat ${beat} velocity`}
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onContextMenu={preventContextMenu}
    >
      <VelocityReadout aria-live="polite">
        {velocityText}
      </VelocityReadout>
      <SliderSlot>
        <VerticalRange
          min={MIN_NOTE_VELOCITY}
          max={MAX_NOTE_VELOCITY}
          step={VELOCITY_STEP}
          value={velocity}
          aria-label={`beat ${beat} velocity multiplier`}
          onChange={(event) => {
            onChangeVelocity(Number(event.currentTarget.value));
          }}
        />
      </SliderSlot>
      <ResetButton
        type="button"
        disabled={velocity === DEFAULT_NOTE_VELOCITY}
        aria-label={`reset beat ${beat} velocity to 100 percent`}
        onClick={onResetVelocity}
      >
        100%
      </ResetButton>
    </Popover>
  );
};
