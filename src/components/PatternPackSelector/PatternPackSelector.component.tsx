import React from 'react';
import Select from 'react-select';
import type { GroupBase, SingleValue } from 'react-select';
import { useTheme } from 'styled-components';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';
import { SavePatternPackModal } from '../SavePatternPackModal';
import type { PatternPack } from '../../common/sequencerModel';

type PatternPackCommand = 'SAVE_PATTERN_PACK_AS' | 'SAVE_PATTERN_PACK' | 'DELETE_PATTERN_PACK';

type PatternPackSelectValue = PatternPack | PatternPackCommand;

type PatternPackOption = {
  label: string;
  value: PatternPackSelectValue;
  disabled?: boolean;
};

type PatternPackSelectorComponentProps = {
  onSelectPatternPack: (option: PatternPackOption) => void;
  patternPacks: PatternPack[];
  currentPatternPack?: PatternPack;
  isEdited: boolean;
  userPatternPacks?: PatternPack[];
};

export const PatternPackSelectorComponent = ({
  onSelectPatternPack,
  patternPacks,
  currentPatternPack,
  isEdited,
  userPatternPacks,
}: PatternPackSelectorComponentProps) => {
  const theme = useTheme();
  const selectedPatternPack = currentPatternPack || patternPacks[0] || { id: 'unknown', name: 'Unknown' };
  const resolvedUserPatternPacks = userPatternPacks || [];
  const defaultPatternPackOptions: PatternPackOption[] = patternPacks.map(patternPack => ({
    label: patternPack.name,
    value: patternPack,
  }));
  const userPatternPackOptions: PatternPackOption[] = resolvedUserPatternPacks.map(patternPack => ({
    label: patternPack.name,
    value: patternPack,
  }));
  const defaultPatternPackSelected = defaultPatternPackOptions.some(option => (
    typeof option.value !== 'string' && option.value.id === selectedPatternPack.id
  ));
  const groupedOptions: GroupBase<PatternPackOption>[] = [
    {
      label: 'Default',
      options: defaultPatternPackOptions,
    },
    {
      label: 'User',
      options: userPatternPackOptions,
    },
    {
      label: 'Memory',
      options: [
        {
          label: 'Save Pattern Pack As...',
          value: 'SAVE_PATTERN_PACK_AS',
        },
        {
          label: `Save "${selectedPatternPack.name}"`,
          value: 'SAVE_PATTERN_PACK',
          disabled: !isEdited || defaultPatternPackSelected,
        },
        {
          label: `Delete "${selectedPatternPack.name}"`,
          value: 'DELETE_PATTERN_PACK',
          disabled: defaultPatternPackSelected,
        },
      ],
    },
  ];

  let selectedOption: PatternPackOption | undefined = [
    ...defaultPatternPackOptions,
    ...userPatternPackOptions,
  ].find(option => (
    typeof option.value !== 'string' && option.value.id === selectedPatternPack.id
  ));

  if (isEdited && selectedOption) {
    selectedOption = {
      ...selectedOption,
      label: `${selectedOption.label} *`,
    };
  }

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
      <Select<PatternPackOption, false, GroupBase<PatternPackOption>>
        options={groupedOptions}
        onChange={handlePatternPackChange}
        value={selectedOption}
        aria-label="Select Pattern Pack"
        isOptionDisabled={({ value, disabled }) => {
          if (value === 'SAVE_PATTERN_PACK') {
            return Boolean(disabled);
          }
          if (value === 'DELETE_PATTERN_PACK') {
            return Boolean(disabled);
          }
          return false;
        }}
        isSearchable={false}
        styles={createSelectStyles<PatternPackOption>(theme)}
      />
      <SavePatternPackModal />
    </Box>
  );
};
