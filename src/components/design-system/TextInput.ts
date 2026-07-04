import styled from 'styled-components';
import * as ss from 'styled-system';
import type { TextInputProps } from './systemProps';

type TextInputDefaultProps = Pick<TextInputProps, 'm' | 'p'>;

const TextInput = styled.input.attrs<TextInputDefaultProps>(({
  m = 0,
  p = 0,
}) => ({ m, p }))<TextInputProps>`
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
