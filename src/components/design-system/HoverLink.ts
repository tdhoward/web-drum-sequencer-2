import styled from 'styled-components';
import * as ss from 'styled-system';
import type { HoverLinkProps } from './systemProps';

export const HoverLink = styled.a<HoverLinkProps>`
  ${ss.opacity}
  text-decoration: none;
  display: inline-block;
  transition: all ${({ transitionSpeed }) => transitionSpeed};

  &:hover, &:focus {
    opacity: ${({ hoverOpacity }) => hoverOpacity};
  }

  &:active {
    opacity: ${({ activeOpacity }) => activeOpacity};
  }
`;
