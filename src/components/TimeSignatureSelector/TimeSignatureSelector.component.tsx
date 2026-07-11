import React from 'react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import { useTheme } from 'styled-components';
import {
  COMMON_TIME_SIGNATURES,
  findTimeSignaturePreset,
  formatTimeSignature,
  type TimeSignaturePreset,
} from '../../common';
import type { TimeSignature } from '../../common/sequencerModel';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';

type TimeSignatureOption = {
  label: string;
  value: TimeSignaturePreset;
};

type TimeSignatureSelectorComponentProps = {
  selectedStepsPerBeat: number;
  selectedTimeSignature: TimeSignature;
  onSelectTimeSignature: (preset: TimeSignaturePreset) => void;
};

const TIME_SIGNATURE_SELECTOR_WIDTH = '8.25em';

const timeSignatureOptions: TimeSignatureOption[] = COMMON_TIME_SIGNATURES.map(preset => ({
  label: preset.label,
  value: preset,
}));

const toOption = (preset: TimeSignaturePreset): TimeSignatureOption => ({
  label: preset.label,
  value: preset,
});

export const TimeSignatureSelectorComponent = ({
  selectedStepsPerBeat,
  selectedTimeSignature,
  onSelectTimeSignature,
}: TimeSignatureSelectorComponentProps) => {
  const theme = useTheme();
  const selectedPreset = findTimeSignaturePreset(selectedTimeSignature) || {
    id: formatTimeSignature(selectedTimeSignature),
    label: formatTimeSignature(selectedTimeSignature),
    timeSignature: selectedTimeSignature,
    stepsPerBeat: selectedStepsPerBeat,
  };

  const handleChange = (option: SingleValue<TimeSignatureOption>) => {
    if (option) {
      onSelectTimeSignature(option.value);
    }
  };

  return (
    <Box
      height="3rem"
      maxWidth="100%"
      position="relative"
      width={TIME_SIGNATURE_SELECTOR_WIDTH}
    >
      <Text
        position="absolute"
        left="0.5rem"
        top="-0.6em"
        color="textMuted"
        fontSize="0.6rem"
        fontWeight="600"
        bg="surfaceApp"
        pl={1}
        pr={1}
        letterSpacing="0.1em"
        zIndex={1}
        borderRadius="3px"
      >
        TIME SIGNATURE
      </Text>
      <Select<TimeSignatureOption>
        aria-label="Select time signature"
        isSearchable={false}
        options={timeSignatureOptions}
        value={toOption(selectedPreset)}
        onChange={handleChange}
        styles={createSelectStyles<TimeSignatureOption>(theme)}
      />
    </Box>
  );
};
