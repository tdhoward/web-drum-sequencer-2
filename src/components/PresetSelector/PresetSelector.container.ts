import React from 'react';
import { connect } from 'react-redux';
import {
  PresetSelectorComponent,
  type PresetSelectorCommand,
  type PresetSelectorOption,
} from './PresetSelector.component';
import { presetSelectorSelectors } from './PresetSelector.selectors';
import {
  setPresetPrompt,
  doSavePreset,
  loadPreset,
  erasePreset,
} from '../../common';
import presets from '../../presets';
import { SavePresetModal } from '../SavePresetModal';
import type { UserPreset } from '../../common';
import type { FactoryPreset } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];
type LoadPresetInput = Parameters<typeof loadPreset>[0];
type PresetCommand = 'SAVE_PRESET_AS' | 'SAVE_PRESET' | 'DELETE_PRESET';
type PresetOption = FactoryPreset | UserPreset;
type PresetSelectOption = PresetSelectorOption<PresetOption, PresetCommand>;
const KitPresetSelectorComponent = PresetSelectorComponent<PresetOption, PresetCommand>;

type PresetSelectorDispatchProps = {
  setPresetPrompt: (isOpen: boolean) => void;
  doSavePreset: (presetName: string) => void;
  loadPreset: (preset: LoadPresetInput) => void;
  erasePreset: (presetName: string) => void;
};

type PresetSelectorOwnProps = {
  label?: string;
};

const mapStateToProps = (state: RootState) => presetSelectorSelectors(state);

type PresetSelectorStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): PresetSelectorDispatchProps => ({
  setPresetPrompt: (isOpen) => {
    dispatch(setPresetPrompt(isOpen));
  },
  doSavePreset: (presetName) => {
    dispatch(doSavePreset(presetName) as unknown as AppAction);
  },
  loadPreset: (preset) => {
    dispatch(loadPreset(preset) as unknown as AppAction);
  },
  erasePreset: (presetName) => {
    dispatch(erasePreset(presetName) as unknown as AppAction);
  },
});

const mergeProps = (
  stateProps: PresetSelectorStateProps,
  dispatchProps: PresetSelectorDispatchProps,
  ownProps: PresetSelectorOwnProps,
) => ({
  ...ownProps,
  ...stateProps,
  presets,
  ariaLabel: 'Select Kit Preset',
  height: '100%',
  memoryOptions: createMemoryOptions(stateProps),
  modal: React.createElement(SavePresetModal),
  onSelectPreset: ({ value }: PresetSelectOption) => {
    const currentPresetName = stateProps.currentPreset?.name;

    switch (value) {
      case 'SAVE_PRESET':
        if (currentPresetName) {
          dispatchProps.doSavePreset(currentPresetName);
        }
        break;
      case 'DELETE_PRESET':
        if (currentPresetName) {
          dispatchProps.erasePreset(currentPresetName);
        }
        break;
      case 'SAVE_PRESET_AS':
        dispatchProps.setPresetPrompt(true);
        break;
      default:
        if (typeof value !== 'string') {
          dispatchProps.loadPreset(value as LoadPresetInput);
        }
        break;
    }
  },
});

const createMemoryOptions = (
  stateProps: PresetSelectorStateProps,
): PresetSelectorCommand<PresetCommand>[] => {
  const selectedPresetName = stateProps.currentPreset?.name || presets[0]?.name || 'Unknown';
  const defaultPresetSelected = presets.some(preset => preset.name === selectedPresetName);

  return [
    {
      label: 'Save Kit As...',
      value: 'SAVE_PRESET_AS',
    },
    {
      label: `Save "${selectedPresetName}"`,
      value: 'SAVE_PRESET',
      disabled: !stateProps.isEdited || defaultPresetSelected,
    },
    {
      label: `Delete "${selectedPresetName}"`,
      value: 'DELETE_PRESET',
      disabled: defaultPresetSelected,
    },
  ];
};

export const PresetSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(KitPresetSelectorComponent);
