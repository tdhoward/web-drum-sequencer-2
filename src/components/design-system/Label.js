import styled from 'styled-components';
import * as ss from 'styled-system';

const Label = styled.label.attrs(({
  m = 0,
  p = 0,
}) => ({ m, p }))`
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
