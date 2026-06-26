import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { useTheme } from 'styled-components';
import { createSelectStyles } from '../../styles/selectStyles';
import { Box, Text } from '../design-system';

export const PatternPackSelectorComponent = ({
  onSelectPatternPack,
  patternPacks,
  selectedPatternPackId,
}) => {
  const theme = useTheme();
  const options = patternPacks.map(patternPack => ({
    label: patternPack.name,
    value: patternPack,
  }));
  const selectedOption = options.find(option => option.value.id === selectedPatternPackId);

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
      <Select
        options={options}
        onChange={onSelectPatternPack}
        value={selectedOption}
        aria-label="Select Pattern Pack"
        isSearchable={false}
        styles={createSelectStyles(theme)}
      />
    </Box>
  );
};

PatternPackSelectorComponent.propTypes = {
  onSelectPatternPack: PropTypes.func.isRequired,
  patternPacks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  selectedPatternPackId: PropTypes.string,
};

PatternPackSelectorComponent.defaultProps = {
  selectedPatternPackId: undefined,
};
