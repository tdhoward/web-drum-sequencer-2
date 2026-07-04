import styled from 'styled-components';
import { Button } from './Button';
import type { AppTheme, ThemeColorValue } from '../../styles/theme';
import type { HoverButtonProps } from './systemProps';

const getColor = (
  theme: AppTheme,
  color: string | undefined,
): ThemeColorValue | undefined => (color ? theme.colors[color] || color : undefined);

export const HoverButton = styled(Button)<HoverButtonProps>`
  transition: all ${({ transitionSpeed }) => transitionSpeed}

  &:hover {
    color: ${({ theme, hoverColor }) => getColor(theme, hoverColor)};
    background-color: ${({ theme, hoverBg }) => getColor(theme, hoverBg)};
    opacity: ${({ hoverOpacity }) => hoverOpacity};
  }

  &:active {
    background-color: ${({ theme, activeBg }) => getColor(theme, activeBg)};
    opacity: ${({ hoverOpacity }) => hoverOpacity};
  }
`;
