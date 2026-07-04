import React from 'react';
import styled from 'styled-components';
import { Knob } from '../Knob.component';
import { Box, Text } from '../design-system';

const LabelText = styled(Text)`
  transform: translateY(-0.3em);
`;

type SwingControlComponentProps = {
  onSetSwing: (event: Event) => void;
  swing: number;
};

export const SwingControlComponent = ({
  onSetSwing,
  swing,
}: SwingControlComponentProps) => (
  <Box alignItems="center" ml={2} display="flex" flexDirection="column">
    <LabelText
      color="textMuted"
      fontSize="0.6rem"
      fontWeight="600"
      bg="surfaceApp"
      pl={1}
      pr={1}
      letterSpacing="0.1em"
    >
      SWING
    </LabelText>
    <Knob size={35} onChange={onSetSwing} value={swing} min={0} max={1} step="0.1" />
  </Box>
);
