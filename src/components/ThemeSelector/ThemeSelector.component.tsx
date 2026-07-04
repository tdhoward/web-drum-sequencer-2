import React from 'react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import { useTheme } from 'styled-components';
import { colorThemes } from '../../styles/theme';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';

type ThemeOption = {
  label: string;
  value: string;
};

type ThemeSelectorComponentProps = {
  selectedThemeId: string;
  setSelectedThemeId: (themeId: string) => void;
};

const themeOptions: ThemeOption[] = Object.values(colorThemes).map(theme => ({
  label: theme.name,
  value: theme.id,
}));

export const ThemeSelectorComponent = ({
  selectedThemeId,
  setSelectedThemeId,
}: ThemeSelectorComponentProps) => {
  const theme = useTheme();
  const selectedOption = themeOptions.find(option => option.value === selectedThemeId);
  const handleThemeChange = (option: SingleValue<ThemeOption>) => {
    if (option) {
      setSelectedThemeId(option.value);
    }
  };

  return (
    <Box height="2.65rem" minWidth="12rem" position="relative">
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
        THEME
      </Text>
      <Select<ThemeOption>
        aria-label="Select Theme"
        isSearchable={false}
        onChange={handleThemeChange}
        options={themeOptions}
        styles={createSelectStyles<ThemeOption>(theme)}
        value={selectedOption}
      />
    </Box>
  );
};
