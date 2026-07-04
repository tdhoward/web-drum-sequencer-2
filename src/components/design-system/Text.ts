import styled from 'styled-components';
import * as ss from 'styled-system';
import type { TextProps } from './systemProps';

type TextDefaultProps = Pick<TextProps, 'm' | 'p' | 'lineHeight' | 'display'>;

const Text = styled.span.attrs<TextDefaultProps>(({
  m = 0,
  p = 0,
  lineHeight = '1em',
  display = 'block',
}) => ({ m, p, lineHeight, display }))<TextProps>`
  ${ss.color}
  ${ss.fontWeight}
  ${ss.fontSize}
  ${ss.space}
  ${ss.position}
  ${ss.left}
  ${ss.top}
  ${ss.letterSpacing}
  ${ss.height}
  ${ss.zIndex}
  ${ss.borderRadius}
  ${ss.textAlign}
  ${ss.opacity}
  ${ss.lineHeight}
  ${ss.display}
  ${ss.verticalAlign}
  user-select: ${({ userSelect }) => userSelect};
`;


export { Text };
