import styled from 'styled-components';
import * as ss from 'styled-system';

const Line = styled.div.attrs(({
  bg = 'nearWhite',
  width = '100%',
  display = 'block',
  height = 1,
}) => ({ bg, width, display, height }))`
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
