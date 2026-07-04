import styled from 'styled-components';
import * as ss from 'styled-system';
import type { LabelProps } from './systemProps';

type LabelDefaultProps = Pick<LabelProps, 'm' | 'p'>;

const Label = styled.label.attrs<LabelDefaultProps>(({
  m = 0,
  p = 0,
}) => ({ m, p }))<LabelProps>`
  ${ss.color}
  ${ss.fontWeight}
  ${ss.fontSize}
  ${ss.space}
  ${ss.position}
  ${ss.left}
  ${ss.top}
  ${ss.letterSpacing}
  ${ss.height}
  display: block;
  line-height: 1em;
`;


export { Label };
