import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import theme from '../../styles/theme';
import { Box, Text } from '../design-system';

export const PatternPackSelectorComponent = ({
  onSelectPatternPack,
  patternPacks,
  selectedPatternPackId,
}) => {
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
        color="gray"
        fontSize="0.6rem"
        fontWeight="600"
        bg="nearBlack"
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
        styles={{
          container: styles => ({
            ...styles,
            height: '100%',
          }),
          control: styles => ({
            ...styles,
            backgroundColor: 'black',
            border: `2px solid ${theme.colors.steel}`,
            height: '100%',
            borderRadius: '0.5em',
          }),
          singleValue: styles => ({
            ...styles,
            color: theme.colors.nearWhite,
          }),
          option: styles => ({
            ...styles,
            padding: '0.4em 1em',
          }),
        }}
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
