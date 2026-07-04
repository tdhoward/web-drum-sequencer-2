import styled from 'styled-components';
import * as ss from 'styled-system';
import type { HeadingProps } from './systemProps';

export const Heading = styled.h1<HeadingProps>`
  ${ss.color}
  ${ss.fontSize}
  ${ss.fontWeight}
  ${ss.space}
  ${ss.fontFamily}
`;
