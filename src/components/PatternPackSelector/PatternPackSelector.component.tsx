import React from 'react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import { useTheme } from 'styled-components';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';
import type { PatternPack } from '../../common/sequencerModel';

type PatternPackOption = {
  label: string;
  value: PatternPack;
};

type PatternPackSelectorComponentProps = {
  onSelectPatternPack: (option: PatternPackOption) => void;
  patternPacks: PatternPack[];
  selectedPatternPackId?: string;
};

export const PatternPackSelectorComponent = ({
  onSelectPatternPack,
  patternPacks,
  selectedPatternPackId,
}: PatternPackSelectorComponentProps) => {
  const theme = useTheme();
  const options: PatternPackOption[] = patternPacks.map(patternPack => ({
    label: patternPack.name,
    value: patternPack,
  }));
  const selectedOption = options.find(option => option.value.id === selectedPatternPackId);
  const handlePatternPackChange = (option: SingleValue<PatternPackOption>) => {
    if (option) {
      onSelectPatternPack(option);
    }
  };

  return (
    <Box height="3rem" minWidth="14rem" position="relative">
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
        PATTERN PACK
      </Text>
      <Select<PatternPackOption>
        options={options}
        onChange={handlePatternPackChange}
        value={selectedOption}
        aria-label="Select Pattern Pack"
        isSearchable={false}
        styles={createSelectStyles<PatternPackOption>(theme)}
      />
    </Box>
  );
};
