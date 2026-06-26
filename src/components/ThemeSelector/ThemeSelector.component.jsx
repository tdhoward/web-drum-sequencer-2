import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { useTheme } from 'styled-components';
import { colorThemes } from '../../styles/theme';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';

const themeOptions = Object.values(colorThemes).map(theme => ({
  label: theme.name,
  value: theme.id,
}));

export const ThemeSelectorComponent = ({
  selectedThemeId,
  setSelectedThemeId,
}) => {
  const theme = useTheme();
  const selectedOption = themeOptions.find(option => option.value === selectedThemeId);

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
      <Select
        aria-label="Select Theme"
        isSearchable={false}
        onChange={option => setSelectedThemeId(option.value)}
        options={themeOptions}
        styles={createSelectStyles(theme)}
        value={selectedOption}
      />
    </Box>
  );
};

ThemeSelectorComponent.propTypes = {
  selectedThemeId: PropTypes.string.isRequired,
  setSelectedThemeId: PropTypes.func.isRequired,
};
