import React from 'react';
import styled from 'styled-components';
import { PLAYBACK_MODES, type PlaybackMode } from '../../common';

type Props = {
  mode: PlaybackMode;
  onChange: (mode: PlaybackMode) => void;
};

const Track = styled.div`
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 999px;
  display: flex;
  padding: 0.15rem;
`;

const Option = styled.button<{ $selected: boolean }>`
  background: ${({ $selected, theme }) => ($selected ? theme.colors.accentPrimary : 'transparent')};
  border: 0;
  border-radius: 999px;
  color: ${({ $selected, theme }) => ($selected ? theme.colors.textInverse : theme.colors.textSecondary)};
  cursor: pointer;
  font-size: 0.58rem;
  font-weight: 600;
  height: 1.65rem;
  letter-spacing: 0.04em;
  padding: 0 0.55rem;
  text-transform: uppercase;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 1px;
  }
`;

export const PlaybackModeSwitchComponent = ({ mode, onChange }: Props) => (
  <Track aria-label="Playback mode" role="group">
    {([PLAYBACK_MODES.PATTERN, PLAYBACK_MODES.SONG] as PlaybackMode[]).map(option => (
      <Option
        key={option}
        $selected={mode === option}
        aria-pressed={mode === option}
        onClick={() => onChange(option)}
        type="button"
      >
        {option}
      </Option>
    ))}
  </Track>
);
