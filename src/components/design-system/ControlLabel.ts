import styled from 'styled-components';
import { Text } from './Text';
import type { TextProps } from './systemProps';

export const ControlLabel = styled(Text)<TextProps>`
  font-size: 0.7em;
  text-transform: uppercase;
  color: white;
`;
