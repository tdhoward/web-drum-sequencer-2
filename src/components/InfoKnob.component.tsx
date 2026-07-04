import React from 'react';
import styled from 'styled-components';
import { Knob, type KnobProps } from './Knob.component';
import { ControlLabel, Box } from './design-system';

const KnobLabel = styled(ControlLabel)`
  color: ${({ theme }) => theme.colors.knobLabelText};
`;

const KnobScaleLabel = styled(ControlLabel)`
  color: ${({ theme }) => theme.colors.knobScaleText};
`;

type InfoKnobProps = Omit<KnobProps, 'size'> & {
  label: string;
  minLabel: string;
  maxLabel: string;
  showLabel?: boolean;
};

export const InfoKnob = ({
  label,
  minLabel,
  maxLabel,
  showLabel = true,
  ...rest
}: InfoKnobProps) => (
  <Box>
    {showLabel && (
      <KnobLabel fontWeight="bold" mb={1} textAlign="center">
        {label}
      </KnobLabel>
    )}
    <Box display="flex" alignItems="baseline">
      <KnobScaleLabel fontSize={1}>
        {minLabel}
      </KnobScaleLabel>
      <Knob size={45} {...rest} />
      <KnobScaleLabel fontSize={1}>
        {maxLabel}
      </KnobScaleLabel>
    </Box>
  </Box>
);
