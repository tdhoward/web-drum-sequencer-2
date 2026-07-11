import React from 'react';
import styled from 'styled-components';
import { PLAYBACK_MODES, type PlaybackMode } from '../../common';

type Props = {
  mode: PlaybackMode;
  onChange: (mode: PlaybackMode) => void;
};

const Control = styled.div`
  align-items: center;
  display: flex;
  gap: 0.35rem;
`;

const Switch = styled.button`
  background: ${({ theme }) => theme.colors.surfaceControl};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: 999px;
  cursor: pointer;
  height: 2.35rem;
  padding: 0.16rem;
  position: relative;
  width: 1.15rem;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 2px;
  }
`;

const Thumb = styled.span<{ $song: boolean }>`
  background: ${({ theme }) => theme.colors.accentPrimary};
  border-radius: 50%;
  box-shadow: ${({ theme }) => `0 0 0.45rem ${theme.colors.accentPrimaryGlow}`};
  height: 0.68rem;
  left: 0.18rem;
  position: absolute;
  top: ${({ $song }) => ($song ? '1.42rem' : '0.18rem')};
  transition: top 0.16s ease;
  width: 0.68rem;
`;

const Labels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Label = styled.button<{ $selected: boolean }>`
  background: transparent;
  border: 0;
  color: ${({ $selected, theme }) => ($selected ? theme.colors.textPrimary : theme.colors.textMuted)};
  cursor: pointer;
  font-size: 0.57rem;
  font-weight: ${({ $selected }) => ($selected ? 700 : 600)};
  letter-spacing: 0.03em;
  line-height: 1.1rem;
  padding: 0;
  text-align: left;
  text-transform: uppercase;

  &:focus-visible {
    outline: 1px solid ${({ theme }) => theme.colors.accentPrimary};
    outline-offset: 1px;
  }
`;

export const PlaybackModeSwitchComponent = ({ mode, onChange }: Props) => {
  const isSong = mode === PLAYBACK_MODES.SONG;
  return (
    <Control aria-label="Playback mode" role="group">
      <Switch
        aria-label={`Playback mode: ${mode}. Switch to ${isSong ? 'pattern' : 'song'}.`}
        aria-pressed={isSong}
        onClick={() => onChange(isSong ? PLAYBACK_MODES.PATTERN : PLAYBACK_MODES.SONG)}
        type="button"
      >
        <Thumb $song={isSong} />
      </Switch>
      <Labels>
        {([PLAYBACK_MODES.PATTERN, PLAYBACK_MODES.SONG] as PlaybackMode[]).map(option => (
          <Label
            key={option}
            $selected={mode === option}
            aria-pressed={mode === option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </Label>
        ))}
      </Labels>
    </Control>
  );
};
