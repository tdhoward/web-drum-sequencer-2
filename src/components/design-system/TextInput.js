import styled from 'styled-components';
import * as ss from 'styled-system';

const TextInput = styled.input.attrs(({
  m = 0,
  p = 0,
}) => ({ m, p }))`
  ${ss.color}
  ${ss.fontWeight}
  ${ss.fontSize}
  ${ss.space}
  ${ss.position}
  ${ss.zIndex}
  ${ss.width}
  ${ss.height}
  ${ss.boxShadow}
  display: block;
  border: none;
`;


export { TextInput };
