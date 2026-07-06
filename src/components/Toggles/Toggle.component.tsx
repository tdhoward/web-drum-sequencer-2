import React from 'react';
import styled from 'styled-components';
import * as ss from 'styled-system';
import { Box } from '../design-system';
import type {
  BorderRadiusProps,
  BordersProps,
  ColorProps,
  HeightProps,
  SpaceProps,
  WidthProps,
} from 'styled-system';

type BeatButtonProps =
  & ColorProps
  & SpaceProps
  & WidthProps
  & HeightProps
  & BordersProps
  & BorderRadiusProps
  & {
    $isActive: boolean;
  };

type BeatButtonDefaultProps = Pick<BeatButtonProps, 'border' | 'borderRadius'>;

type ToggleProps = {
  isActive: boolean;
  onClick: () => void;
  beat: number;
};

const BeatButton = styled.button.attrs<BeatButtonDefaultProps>(({
  border = 'none',
  borderRadius = '100%',
}) => ({ border, borderRadius }))<BeatButtonProps>`
  ${ss.color}
  ${ss.space}
  ${ss.width}
  ${ss.height}
  ${ss.borders}
  ${ss.borderRadius}
  padding: 0;
  outline: none;
  transition: background-color 0.1s;
  position: relative;
  background: ${({ $isActive, theme }) => ($isActive
    ? `linear-gradient(180deg, ${theme.colors.accentPrimaryActive} 0%, ${theme.colors.accentPrimary} 100%)`
    : theme.colors.sequencerBeatInactiveBackground)};

  &:focus {
    box-shadow: 0 0 5px 5px rgba(100, 180, 255, 0.5);
  }
`;


export const Toggle = ({ isActive, onClick, beat }: ToggleProps) => (
  <BeatButton
    type="button"
    $isActive={isActive}
    onClick={onClick}
    width={[18, 18, 18, 18, 18, 20, 24, 26]}
    height={[18, 18, 18, 18, 18, 20, 24, 26]}
    p={0}
    aria-label={isActive ? `disable beat ${beat}` : `enable beat ${beat}`}
  >
    <Box
      className="wds-beat-marker"
      data-beat={beat}
      data-active={isActive}
      position="absolute"
      bg="white"
      width="100%"
      height="100%"
      left={0}
      top={0}
      borderRadius="100%"
      style={{ opacity: 0, transform: 'scale(1)' }}
    />
  </BeatButton>
);
