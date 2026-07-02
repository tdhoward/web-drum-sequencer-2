import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Knob } from './Knob.component';
import { ControlLabel, Box } from './design-system';

const KnobLabel = styled(ControlLabel)`
  color: ${({ theme }) => theme.colors.knobLabelText};
`;

const KnobScaleLabel = styled(ControlLabel)`
  color: ${({ theme }) => theme.colors.knobScaleText};
`;

export const InfoKnob = ({
  label,
  minLabel,
  maxLabel,
  showLabel = true,
  ...rest
}) => (
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

InfoKnob.propTypes = {
  label: PropTypes.string.isRequired,
  minLabel: PropTypes.string.isRequired,
  maxLabel: PropTypes.string.isRequired,
  showLabel: PropTypes.bool,
};
