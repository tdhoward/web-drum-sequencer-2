import styled from 'styled-components';
import { variant } from 'styled-system';
import { Button } from './design-system';

const fancyButtonStyle = variant({
  key: 'fancyButtons',
});

export const FancyButton = styled(Button)`
  ${fancyButtonStyle}
  transition: box-shadow 0.2s, transform 0.2s;
  text-transform: uppercase;
  height: calc(100% - 4px);
  
  &:active: {
    transform: translateY(0.3em);
  }
`;
