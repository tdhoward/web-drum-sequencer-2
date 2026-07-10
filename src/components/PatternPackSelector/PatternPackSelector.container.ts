import React from 'react';
import { connect } from 'react-redux';
import patternPacks from '../../patternPacks';
import {
  doSavePatternPack,
  erasePatternPack,
  loadPatternPack,
  setPatternPackPrompt,
} from '../../common';
import { patternPackSelectorSelectors } from './PatternPackSelector.selectors';
import {
  PresetSelectorComponent,
  type PresetSelectorCommand,
  type PresetSelectorOption,
} from '../PresetSelector/PresetSelector.component';
import { SavePatternPackModal } from '../SavePatternPackModal';
import type { PatternPack } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];
type PatternPackCommand =
  'SAVE_PATTERN_PACK_AS' | 'SAVE_PATTERN_PACK' | 'DELETE_PATTERN_PACK';
const PatternPackSelectorComponent =
  PresetSelectorComponent<PatternPack, PatternPackCommand>;

type PatternPackSelectorDispatchProps = {
  doSavePatternPack: (patternPackId: string) => void;
  erasePatternPack: (patternPackId: string) => void;
  loadPatternPack: (patternPack: PatternPack) => void;
  setPatternPackPrompt: (isOpen: boolean) => void;
};

type PatternPackSelectOption = PresetSelectorOption<PatternPack, PatternPackCommand>;

const mapStateToProps = (state: RootState) => patternPackSelectorSelectors(state);

type PatternPackSelectorStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): PatternPackSelectorDispatchProps => ({
  doSavePatternPack: (patternPackId) => {
    dispatch(doSavePatternPack(patternPackId) as unknown as AppAction);
  },
  erasePatternPack: (patternPackId) => {
    dispatch(erasePatternPack(patternPackId) as unknown as AppAction);
  },
  loadPatternPack: (patternPack) => {
    dispatch(loadPatternPack(patternPack) as unknown as AppAction);
  },
  setPatternPackPrompt: (isOpen) => {
    dispatch(setPatternPackPrompt(isOpen));
  },
});

const mergeProps = (
  stateProps: PatternPackSelectorStateProps,
  dispatchProps: PatternPackSelectorDispatchProps,
) => ({
  ...stateProps,
  ariaLabel: 'Select Pattern Pack',
  currentPreset: stateProps.currentPatternPack,
  getPresetId: (patternPack: PatternPack) => patternPack.id,
  label: 'PATTERN PACK',
  memoryOptions: createMemoryOptions(stateProps),
  modal: React.createElement(SavePatternPackModal),
  presets: patternPacks,
  userPresets: stateProps.userPatternPacks,
  onSelectPreset: ({ value }: PatternPackSelectOption) => {
    const currentPatternPackId = stateProps.currentPatternPack?.id;

    switch (value) {
      case 'SAVE_PATTERN_PACK':
        if (currentPatternPackId) {
          dispatchProps.doSavePatternPack(currentPatternPackId);
        }
        break;
      case 'DELETE_PATTERN_PACK':
        if (currentPatternPackId) {
          dispatchProps.erasePatternPack(currentPatternPackId);
        }
        break;
      case 'SAVE_PATTERN_PACK_AS':
        dispatchProps.setPatternPackPrompt(true);
        break;
      default:
        if (typeof value !== 'string') {
          dispatchProps.loadPatternPack(value);
        }
        break;
    }
  },
});

const createMemoryOptions = (
  stateProps: PatternPackSelectorStateProps,
): PresetSelectorCommand<PatternPackCommand>[] => {
  const selectedPatternPack = stateProps.currentPatternPack || patternPacks[0];
  const selectedPatternPackName = selectedPatternPack?.name || 'Unknown';
  const selectedPatternPackId = selectedPatternPack?.id;
  const defaultPatternPackSelected = patternPacks.some(
    patternPack => patternPack.id === selectedPatternPackId,
  );

  return [
    {
      label: 'Save Pattern Pack As...',
      value: 'SAVE_PATTERN_PACK_AS',
    },
    {
      label: `Save "${selectedPatternPackName}"`,
      value: 'SAVE_PATTERN_PACK',
      disabled: !stateProps.isEdited || defaultPatternPackSelected,
    },
    {
      label: `Delete "${selectedPatternPackName}"`,
      value: 'DELETE_PATTERN_PACK',
      disabled: defaultPatternPackSelected,
    },
  ];
};

export const PatternPackSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PatternPackSelectorComponent);
