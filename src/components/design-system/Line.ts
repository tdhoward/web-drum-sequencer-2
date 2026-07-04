import styled from 'styled-components';
import * as ss from 'styled-system';
import type { LineProps } from './systemProps';

type LineDefaultProps = Pick<LineProps, 'bg' | 'width' | 'display' | 'height'>;

const Line = styled.div.attrs<LineDefaultProps>(({
  bg = 'nearWhite',
  width = '100%',
  display = 'block',
  height = 1,
}) => ({ bg, width, display, height }))<LineProps>`
  ${ss.color}
  ${ss.space}
  ${ss.borderRadius}
  ${ss.width}
  ${ss.height}
  ${ss.flex}
  ${ss.display}
  ${ss.opacity}
  ${ss.position}
  ${ss.alignItems}
`;


export { Line };
