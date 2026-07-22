import React from 'react';
import Select from 'react-select';
import type { GroupBase, SingleValue } from 'react-select';
import { useTheme } from 'styled-components';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';

type PresetSelectorPreset = {
  name: string;
};

export type PresetSelectorOption<
  TPreset extends PresetSelectorPreset,
  TCommand extends string = string,
> = {
  label: string;
  value: TPreset | TCommand;
  disabled?: boolean;
};

export type PresetSelectorCommand<TCommand extends string = string> = {
  label: string;
  value: TCommand;
  disabled?: boolean;
};

type PresetSelectorComponentProps<
  TPreset extends PresetSelectorPreset,
  TCommand extends string = string,
> = {
  ariaLabel?: string;
  currentPreset?: TPreset;
  defaultGroupLabel?: string;
  getPresetId?: (preset: TPreset) => string;
  getPresetName?: (preset: TPreset) => string;
  height?: string;
  isEdited?: boolean;
  label?: string;
  memoryGroupLabel?: string;
  memoryOptions?: PresetSelectorCommand<TCommand>[];
  minWidth?: string;
  modal?: React.ReactNode;
  onSelectPreset: (option: PresetSelectorOption<TPreset, TCommand>) => void;
  presets: TPreset[];
  showUserGroup?: boolean;
  userGroupLabel?: string;
  userPresets?: TPreset[];
  width?: string;
};

const PRESET_SELECTOR_WIDTH = '14.5em';

const defaultGetPresetId = <TPreset extends PresetSelectorPreset>(preset: TPreset): string => (
  preset.name
);

const defaultGetPresetName = <TPreset extends PresetSelectorPreset>(preset: TPreset): string => (
  preset.name
);

export function PresetSelectorComponent<
  TPreset extends PresetSelectorPreset,
  TCommand extends string = string,
>({
  ariaLabel = 'Select Preset',
  currentPreset,
  defaultGroupLabel = 'Default',
  getPresetId = defaultGetPresetId,
  getPresetName = defaultGetPresetName,
  height = '3rem',
  isEdited = false,
  label = 'PRESETS',
  memoryGroupLabel = 'Memory',
  memoryOptions = [],
  minWidth,
  modal,
  onSelectPreset,
  presets,
  showUserGroup = true,
  userGroupLabel = 'User',
  userPresets,
  width = PRESET_SELECTOR_WIDTH,
}: PresetSelectorComponentProps<TPreset, TCommand>) {
  const theme = useTheme();
  const resolvedUserPresets = userPresets || [];
  const selectedPreset = currentPreset || presets[0];
  const selectedPresetId = selectedPreset ? getPresetId(selectedPreset) : undefined;
  const defaultPresetOptions: PresetSelectorOption<TPreset, TCommand>[] = presets.map(preset => ({
    label: getPresetName(preset),
    value: preset,
  }));

  const userPresetOptions: PresetSelectorOption<TPreset, TCommand>[] = resolvedUserPresets.map(preset => ({
    label: getPresetName(preset),
    value: preset,
  }));

  const groupedOptions: GroupBase<PresetSelectorOption<TPreset, TCommand>>[] = [
    {
      label: defaultGroupLabel,
      options: defaultPresetOptions,
    },
  ];

  if (showUserGroup || userPresetOptions.length > 0) {
    groupedOptions.push({
      label: userGroupLabel,
      options: userPresetOptions,
    });
  }

  if (memoryOptions.length > 0) {
    groupedOptions.push({
      label: memoryGroupLabel,
      options: memoryOptions,
    });
  }

  let selectedOption: PresetSelectorOption<TPreset, TCommand> | undefined = [
    ...defaultPresetOptions,
    ...userPresetOptions,
  ].find(option => (
    typeof option.value !== 'string'
      && selectedPresetId !== undefined
      && getPresetId(option.value) === selectedPresetId
  ));

  if (isEdited && selectedOption) {
    selectedOption = {
      ...selectedOption,
      label: `${selectedOption.label} *`,
    };
  }

  const handlePresetChange = (
    option: SingleValue<PresetSelectorOption<TPreset, TCommand>>,
  ) => {
    if (option) {
      onSelectPreset(option);
    }
  };

  return (
    <Box
      height={height}
      maxWidth="100%"
      minWidth={minWidth}
      position="relative"
      width={width}
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
        {label}
      </Text>
      <Select<
        PresetSelectorOption<TPreset, TCommand>,
        false,
        GroupBase<PresetSelectorOption<TPreset, TCommand>>
      >
        options={groupedOptions}
        onChange={handlePresetChange}
        value={selectedOption}
        aria-label={ariaLabel}
        isOptionDisabled={({ disabled }) => Boolean(disabled)}
        isSearchable={false}
        styles={createSelectStyles<PresetSelectorOption<TPreset, TCommand>>(theme)}
      />
      {modal}
    </Box>
  );
}
