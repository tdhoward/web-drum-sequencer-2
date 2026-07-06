import React from 'react';
import Select from 'react-select';
import type { GroupBase, StylesConfig } from 'react-select';
import { useTheme } from 'styled-components';
import { Box, ControlLabel } from '../design-system';
import sampleOptions from '../../samples.config';
import { createSelectStyles } from '../../styles/selectStyles';
import {
  getUserSampleDisplayName,
  getUserSampleId,
  type UserSample,
} from '../../common';

const CHOOSE_FILE_VALUE = 'CHOOSE_FILE';

type SampleSelectOption = {
  value: string;
  label: string;
};

type SampleSelectChannel = {
  id: string;
  sample?: string;
  sampleLoaded?: boolean;
};

type SampleSelectComponentProps = {
  onSelectSample: (sample: SampleSelectOption) => void;
  onSampleFileChosen: React.ChangeEventHandler<HTMLInputElement>;
  channel: SampleSelectChannel;
  userSamples: UserSample[];
  showLabel?: boolean;
};

const openFileInput = React.createRef<HTMLInputElement>();

const factoryOptions: SampleSelectOption[] = sampleOptions.map(sampleOption => ({
  value: sampleOption.url,
  label: sampleOption.name,
}));

const userSampleToOption = (userSample: UserSample): SampleSelectOption => {
  return {
    value: getUserSampleId(userSample),
    label: getUserSampleDisplayName(userSample),
  };
};

const getSampleSelectOptions = (
  userOptions: SampleSelectOption[] = [],
): GroupBase<SampleSelectOption>[] => [
  {
    label: 'User',
    options: [
      {
        value: CHOOSE_FILE_VALUE,
        label: 'Choose file...',
      },
      ...userOptions,
    ],
  },
  {
    label: '707',
    options: factoryOptions.filter(item => item.label.includes('707')),
  },
  {
    label: '808',
    options: factoryOptions.filter(item => item.label.includes('808')),
  },
  {
    label: 'Ace',
    options: factoryOptions.filter(item => item.label.includes('Ace')),
  },
  {
    label: 'LDrum',
    options: factoryOptions.filter(item => item.label.includes('LDrum')),
  },
  {
    label: 'Hip-hop',
    options: factoryOptions.filter(item => item.label.includes('Hip Hop')),
  },
];

export const SampleSelectComponent = ({
  onSelectSample,
  onSampleFileChosen,
  channel,
  userSamples,
  showLabel = true,
}: SampleSelectComponentProps) => {
  const theme = useTheme();
  const userOptions = userSamples.map(userSampleToOption);
  const allOptions = userOptions.concat(factoryOptions);
  const currentOption = allOptions.find(option => channel.sample === option.value);
  const selectStyles: StylesConfig<SampleSelectOption, false, GroupBase<SampleSelectOption>> = {
    ...createSelectStyles<SampleSelectOption>(theme),
    container: styles => ({
      ...styles,
      height: '3rem',
    }),
    singleValue: styles => ({
      ...styles,
      color: theme.colors.textPrimary,
      opacity: channel.sampleLoaded ? 1 : 0.3,
    }),
    menu: styles => ({
      ...styles,
      fontSize: '0.8rem',
      width: '16rem',
    }),
    option: styles => ({
      ...styles,
      paddingTop: '0.2em',
      paddingBottom: '0.2em',
    }),
  };

  return (
    <Box>
      {showLabel && (
        <ControlLabel fontWeight="bold" mb={1} ml={1} textAlign="left">
          SAMPLE
        </ControlLabel>
      )}
      <Select<SampleSelectOption, false, GroupBase<SampleSelectOption>>
        aria-label="Select Channel"
        options={getSampleSelectOptions(userOptions)}
        onChange={(choice) => {
          if (!choice) {
            return;
          }

          if (choice.value === CHOOSE_FILE_VALUE) {
            openFileInput.current?.click();
          } else {
            onSelectSample(choice);
          }
        }}
        value={currentOption}
        isSearchable={false}
        styles={selectStyles}
      />
      <input
        type="file"
        ref={openFileInput}
        style={{ display: 'none' }}
        onChange={onSampleFileChosen}
        accept="audio/*"
      />
    </Box>
  );
};
