import React from 'react';
import { connect } from 'react-redux';
import {
  PresetSelectorComponent,
  type PresetSelectorOption,
} from './PresetSelector.component';
import {
  createKitPresetMemoryOptions,
  type KitPresetCommand,
} from './PresetSelector.commands';
import { presetSelectorSelectors } from './PresetSelector.selectors';
import {
  setPresetPrompt,
  doSavePreset,
  requestPresetLoad,
  erasePreset,
  exportSelectedKit,
  importKitFile,
} from '../../common';
import presets from '../../presets';
import { openKitFilePicker } from '../../services/kitFiles';
import { SavePresetModal } from '../SavePresetModal';
import type { UserPreset } from '../../common';
import type { FactoryPreset } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];
type LoadPresetInput = Parameters<typeof requestPresetLoad>[0];
type PresetOption = FactoryPreset | UserPreset;
type PresetSelectOption = PresetSelectorOption<PresetOption, KitPresetCommand>;
const KitPresetSelectorComponent = PresetSelectorComponent<PresetOption, KitPresetCommand>;

type PresetSelectorDispatchProps = {
  setPresetPrompt: (isOpen: boolean) => void;
  doSavePreset: (presetName: string) => void;
  loadPreset: (preset: LoadPresetInput) => void;
  erasePreset: (presetName: string) => void;
  exportKit: () => void;
  importKit: (file: File) => void;
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
    dispatch(requestPresetLoad(preset) as unknown as AppAction);
  },
  erasePreset: (presetName) => {
    dispatch(erasePreset(presetName) as unknown as AppAction);
  },
  exportKit: () => {
    dispatch(exportSelectedKit() as unknown as AppAction);
  },
  importKit: (file) => {
    dispatch(importKitFile(file) as unknown as AppAction);
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
      case 'EXPORT_KIT':
        dispatchProps.exportKit();
        break;
      case 'IMPORT_KIT':
        openKitFilePicker(dispatchProps.importKit);
        break;
      default:
        if (typeof value !== 'string') {
          dispatchProps.loadPreset(value as LoadPresetInput);
        }
        break;
    }
  },
});

const createMemoryOptions = (stateProps: PresetSelectorStateProps) => {
  const selectedPresetName = stateProps.currentPreset?.name || presets[0]?.name || 'Unknown';
  const defaultPresetSelected = presets.some(preset => preset.name === selectedPresetName);
  return createKitPresetMemoryOptions(
    selectedPresetName,
    stateProps.isEdited,
    defaultPresetSelected,
  );
};

export const PresetSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(KitPresetSelectorComponent);
