import styled from 'styled-components';
import * as ss from 'styled-system';
import type { BoxProps } from './systemProps';

export const Box = styled.div<BoxProps>`
  ${ss.color}
  ${ss.space}
  ${ss.borders}
  ${ss.borderColor}
  ${ss.borderRadius}
  ${ss.width}
  ${ss.height}
  ${ss.flex}
  ${ss.flexDirection}
  ${ss.display}
  ${ss.justifyContent}
  ${ss.opacity}
  ${ss.position}
  ${ss.alignItems}
  ${ss.left}
  ${ss.top}
  ${ss.bottom}
  ${ss.right}
  ${ss.zIndex}
  ${ss.boxShadow}
  ${ss.maxWidth}
  ${ss.minWidth}
  ${ss.maxHeight}
  ${ss.minHeight}
  box-sizing: border-box;
`;
