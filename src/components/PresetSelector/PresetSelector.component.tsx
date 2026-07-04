import React from 'react';
import Select from 'react-select';
import type { GroupBase } from 'react-select';
import { useTheme } from 'styled-components';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';
import { SavePresetModal } from '../SavePresetModal';
import type { UserPreset } from '../../common';
import type { FactoryPreset } from '../../common/sequencerModel';

type PresetCommand = 'SAVE_PRESET_AS' | 'SAVE_PRESET' | 'DELETE_PRESET';

type PresetSelectValue = FactoryPreset | UserPreset | PresetCommand;

type PresetSelectOption = {
  label: string;
  value: PresetSelectValue;
  disabled?: boolean;
};

type PresetSelectorComponentProps = {
  onSelectPreset: (option: PresetSelectOption) => void;
  presets: FactoryPreset[];
  currentPreset?: FactoryPreset | UserPreset;
  isEdited: boolean;
  userPresets?: UserPreset[];
  label?: string;
};

export const PresetSelectorComponent = ({
  onSelectPreset,
  presets,
  currentPreset,
  isEdited,
  userPresets,
  label = 'PRESETS',
}: PresetSelectorComponentProps) => {
  const theme = useTheme();
  const selectedPreset = currentPreset || presets[0] || { name: 'Unknown' };
  const resolvedUserPresets = userPresets || [];
  const defaultPresetOptions: PresetSelectOption[] = presets.map(preset => ({
    label: preset.name,
    value: preset,
  }));

  const userPresetOptions: PresetSelectOption[] = resolvedUserPresets.map(preset => ({
    label: preset.name,
    value: preset,
  }));

  const defaultPresetSelected = defaultPresetOptions.find(
    option => option.label === selectedPreset.name,
  ) !== undefined;

  const groupedOptions: GroupBase<PresetSelectOption>[] = [
    {
      label: 'Default',
      options: defaultPresetOptions,
    },
    {
      label: 'User',
      options: userPresetOptions,
    },
    {
      label: 'Memory',
      options: [
        {
          label: 'Save Kit As...',
          value: 'SAVE_PRESET_AS',
        },
        {
          label: `Save "${selectedPreset.name}"`,
          value: 'SAVE_PRESET',
          disabled: !isEdited || defaultPresetSelected,
        },
        {
          label: `Delete "${selectedPreset.name}"`,
          value: 'DELETE_PRESET',
          disabled: defaultPresetSelected,
        },
      ],
    },
  ];

  let selectedOption: PresetSelectOption | undefined = [
    ...defaultPresetOptions,
    ...userPresetOptions,
  ].find(option => option.label === selectedPreset.name);

  if (isEdited && selectedOption) {
    selectedOption = {
      ...selectedOption,
      label: `${selectedOption.label} *`,
    };
  }

  return (
    <Box height="100%" position="relative">
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
        {label}
      </Text>
      <Select<PresetSelectOption, false, GroupBase<PresetSelectOption>>
        options={groupedOptions}
        onChange={(option) => {
          if (option) {
            onSelectPreset(option);
          }
        }}
        value={selectedOption}
        aria-label="Select Preset"
        isOptionDisabled={({ value, disabled }) => {
          if (value === 'SAVE_PRESET') {
            return Boolean(disabled);
          }
          if (value === 'DELETE_PRESET') {
            return Boolean(disabled);
          }
          return false;
        }}
        isSearchable={false}
        styles={createSelectStyles<PresetSelectOption>(theme)}
      />
      <SavePresetModal />
    </Box>
  );
};
