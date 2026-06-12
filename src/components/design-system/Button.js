import styled from 'styled-components';
import * as ss from 'styled-system';

const Button = styled.button.attrs(({
  border = 'none',
  fontWeight = 'bold',
  borderRadius = '0.25rem',
  variant = 'primary',
  width = 5,
}) => ({ border, fontWeight, borderRadius, variant, width }))`
  ${ss.color}
  ${ss.width}
  ${ss.height}
  ${ss.space}
  ${ss.borders}
  ${ss.borderRadius}
  ${ss.fontWeight}
  ${ss.fontSize}
  ${ss.alignSelf}
  ${ss.width}
  ${ss.height}
  ${ss.flex}
  ${ss.position}
  ${ss.left}
  ${ss.top}
  ${ss.bottom}
  ${ss.right}
  ${ss.display}
  ${ss.alignItems}
  ${ss.justifyContent}
  ${ss.opacity}
  ${ss.minWidth}
  outline: ${({ outline }) => outline};
  touch-action: manipulation;
`;


export { Button };
