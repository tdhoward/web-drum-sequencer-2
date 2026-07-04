import { connect } from 'react-redux';
import { PresetSelectorComponent } from './PresetSelector.component';
import { presetSelectorSelectors } from './PresetSelector.selectors';
import {
  setPresetPrompt,
  doSavePreset,
  loadPreset,
  erasePreset,
} from '../../common';
import presets from '../../presets';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];
type LoadPresetInput = Parameters<typeof loadPreset>[0];
type PresetSelectOption = {
  value: LoadPresetInput | string;
};

type PresetSelectorDispatchProps = {
  setPresetPrompt: (isOpen: boolean) => void;
  doSavePreset: (presetName: string) => void;
  loadPreset: (preset: LoadPresetInput) => void;
  erasePreset: (presetName: string) => void;
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
) => ({
  ...stateProps,
  presets,
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
          dispatchProps.loadPreset(value);
        }
        break;
    }
  },
});

export const PresetSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PresetSelectorComponent);
