import styled from 'styled-components';
import * as ss from 'styled-system';
import type { ImageProps } from './systemProps';

export const Image = styled.img<ImageProps>`
  ${ss.color}
  ${ss.space}
  ${ss.width}
  ${ss.height}
  ${ss.flex}
  ${ss.display}
  ${ss.justifyContent}
  ${ss.opacity}
  ${ss.position}
  user-select: ${({ userSelect }) => userSelect};
`;
