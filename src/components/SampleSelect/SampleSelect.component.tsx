import React, { useRef } from 'react';
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
import { SampleRecorderModal } from '../SampleRecorderModal';

export const CHOOSE_FILE_VALUE = 'CHOOSE_FILE';
export const RECORD_SAMPLE_VALUE = 'RECORD_SAMPLE';

export type SampleSelectOption = {
  value: string;
  label: string;
};

type ReferenceSampleTarget = {
  channelId: string;
  channelName?: string;
  sampleUrl?: string;
  sampleLoaded?: boolean;
};

type SampleSelectComponentProps = {
  onSelectSample: (sample: SampleSelectOption) => void;
  onSampleFileChosen: React.ChangeEventHandler<HTMLInputElement>;
  onSaveRecordedSample: (audioBuffer: AudioBuffer, sampleName: string) => Promise<void> | void;
  target: ReferenceSampleTarget;
  userSamples: UserSample[];
  showLabel?: boolean;
};

type SamplePickerProps = {
  ariaLabel?: string;
  disabled?: boolean;
  onChooseFile?: () => void;
  onRecordSample?: () => void;
  onSelectSample: (sample: SampleSelectOption) => void;
  sample?: string;
  sampleLoaded?: boolean;
  userSamples: UserSample[];
};

export const factorySampleOptions: SampleSelectOption[] = sampleOptions.map(sampleOption => ({
  value: sampleOption.url,
  label: sampleOption.name,
}));

export const userSampleToOption = (userSample: UserSample): SampleSelectOption => {
  return {
    value: getUserSampleId(userSample),
    label: getUserSampleDisplayName(userSample),
  };
};

export const getSampleSelectOptions = (
  userOptions: SampleSelectOption[] = [],
  includeCreationOptions = true,
): GroupBase<SampleSelectOption>[] => [
  {
    label: 'User',
    options: [
      ...(includeCreationOptions ? [
        {
          value: CHOOSE_FILE_VALUE,
          label: 'Choose file...',
        },
        {
          value: RECORD_SAMPLE_VALUE,
          label: 'Record sample...',
        },
      ] : []),
      ...userOptions,
    ],
  },
  {
    label: '707',
    options: factorySampleOptions.filter(item => item.label.includes('707')),
  },
  {
    label: '808',
    options: factorySampleOptions.filter(item => item.label.includes('808')),
  },
  {
    label: 'Ace',
    options: factorySampleOptions.filter(item => item.label.includes('Ace')),
  },
  {
    label: 'LDrum',
    options: factorySampleOptions.filter(item => item.label.includes('LDrum')),
  },
  {
    label: 'Hip-hop',
    options: factorySampleOptions.filter(item => item.label.includes('Hip Hop')),
  },
];

export const getSampleOption = (
  sample: string | undefined,
  userSamples: UserSample[],
): SampleSelectOption | undefined => {
  const allOptions = userSamples.map(userSampleToOption).concat(factorySampleOptions);
  return allOptions.find(option => sample === option.value);
};

export const getSampleDisplayName = (
  sample: string | undefined,
  userSamples: UserSample[],
): string => getSampleOption(sample, userSamples)?.label || sample || 'Sample unavailable';

export const SamplePicker = ({
  ariaLabel = 'Select sample',
  disabled = false,
  onChooseFile,
  onRecordSample,
  onSelectSample,
  sample,
  sampleLoaded,
  userSamples,
}: SamplePickerProps) => {
  const theme = useTheme();
  const userOptions = userSamples.map(userSampleToOption);
  const currentOption = getSampleOption(sample, userSamples);
  const includeCreationOptions = Boolean(onChooseFile || onRecordSample);
  const selectStyles: StylesConfig<SampleSelectOption, false, GroupBase<SampleSelectOption>> = {
    ...createSelectStyles<SampleSelectOption>(theme, {
      menuFontSize: '0.8rem',
      menuWidth: '16rem',
      optionPadding: '0.2em 1em',
    }),
    container: styles => ({
      ...styles,
      height: '3rem',
    }),
    singleValue: styles => ({
      ...styles,
      color: theme.colors.textPrimary,
      opacity: sampleLoaded === false ? 0.3 : 1,
    }),
  };

  return (
    <Select<SampleSelectOption, false, GroupBase<SampleSelectOption>>
      aria-label={ariaLabel}
      isDisabled={disabled}
      options={getSampleSelectOptions(userOptions, includeCreationOptions)}
      onChange={(choice) => {
        if (!choice) {
          return;
        }

        if (choice.value === CHOOSE_FILE_VALUE) {
          onChooseFile?.();
        } else if (choice.value === RECORD_SAMPLE_VALUE) {
          onRecordSample?.();
        } else {
          onSelectSample(choice);
        }
      }}
      value={currentOption}
      isSearchable={false}
      styles={selectStyles}
    />
  );
};

export const SampleSelectComponent = ({
  onSelectSample,
  onSampleFileChosen,
  onSaveRecordedSample,
  target,
  userSamples,
  showLabel = true,
}: SampleSelectComponentProps) => {
  const openFileInput = useRef<HTMLInputElement>(null);
  const [isRecorderOpen, setIsRecorderOpen] = React.useState(false);

  return (
    <Box>
      {showLabel && (
        <ControlLabel fontWeight="bold" mb={1} ml={1} textAlign="left">
          SAMPLE
        </ControlLabel>
      )}
      <SamplePicker
        ariaLabel="Select Channel"
        onChooseFile={() => openFileInput.current?.click()}
        onRecordSample={() => setIsRecorderOpen(true)}
        onSelectSample={onSelectSample}
        sample={target.sampleUrl}
        sampleLoaded={target.sampleLoaded}
        userSamples={userSamples}
      />
      <input
        type="file"
        ref={openFileInput}
        style={{ display: 'none' }}
        onChange={onSampleFileChosen}
        accept="audio/*"
      />
      <SampleRecorderModal
        channelName={target.channelName || target.channelId}
        onClose={() => setIsRecorderOpen(false)}
        onSaveRecordedSample={onSaveRecordedSample}
        show={isRecorderOpen}
      />
    </Box>
  );
};
