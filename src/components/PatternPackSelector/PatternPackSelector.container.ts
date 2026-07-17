import React from 'react';
import { connect } from 'react-redux';
import patternPacks from '../../patternPacks';
import {
  doSavePatternPack,
  erasePatternPack,
  exportSelectedPatternPack,
  importPatternPackFile,
  needsMappingReview,
  requestPatternPackLoad,
  setPatternPackPrompt,
  setPatternPackRenamePrompt,
} from '../../common';
import { patternPackSelectorSelectors } from './PatternPackSelector.selectors';
import {
  PresetSelectorComponent,
  type PresetSelectorOption,
} from '../PresetSelector/PresetSelector.component';
import { SavePatternPackModal } from '../SavePatternPackModal';
import type { PatternPack } from '../../common/sequencerModel';
import type { KitChannelMappingResult } from '../../common';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import { clearScheduledNotes } from '../../services/audioScheduler';
import { stopAllNotes } from '../../services/audioRouter';
import { openPatternPackFilePicker } from '../../services/patternPackFiles';
import {
  createPatternPackMemoryOptions,
  type PatternPackCommand,
} from './PatternPackSelector.commands';

type AppAction = Parameters<AppDispatch>[0];
const PatternPackSelectorComponent =
  PresetSelectorComponent<PatternPack, PatternPackCommand>;

type PatternPackSelectorDispatchProps = {
  doSavePatternPack: (patternPackId: string) => void;
  erasePatternPack: (patternPackId: string) => void;
  exportPatternPack: () => void;
  importPatternPack: (file: File) => void;
  loadPatternPack: (patternPack: PatternPack) => void;
  setPatternPackPrompt: (isOpen: boolean) => void;
  setPatternPackRenamePrompt: (isOpen: boolean) => void;
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
  exportPatternPack: () => {
    dispatch(exportSelectedPatternPack() as unknown as AppAction);
  },
  importPatternPack: (file) => {
    dispatch(importPatternPackFile(file) as unknown as AppAction);
  },
  loadPatternPack: (patternPack) => {
    const result = dispatch(
      requestPatternPackLoad(patternPack) as unknown as AppAction,
    ) as unknown as KitChannelMappingResult;
    if (!needsMappingReview(result)) {
      stopAllNotes();
      clearScheduledNotes();
    }
  },
  setPatternPackPrompt: (isOpen) => {
    dispatch(setPatternPackPrompt(isOpen));
  },
  setPatternPackRenamePrompt: (isOpen) => {
    dispatch(setPatternPackRenamePrompt(isOpen));
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
      case 'RENAME_PATTERN_PACK':
        dispatchProps.setPatternPackRenamePrompt(true);
        break;
      case 'EXPORT_PATTERN_PACK':
        dispatchProps.exportPatternPack();
        break;
      case 'IMPORT_PATTERN_PACK':
        openPatternPackFilePicker(dispatchProps.importPatternPack);
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
) => {
  const selectedPatternPack = stateProps.currentPatternPack || patternPacks[0];
  const selectedPatternPackName = selectedPatternPack?.name || 'Unknown';
  const selectedPatternPackId = selectedPatternPack?.id;
  const defaultPatternPackSelected = patternPacks.some(
    patternPack => patternPack.id === selectedPatternPackId,
  );

  return createPatternPackMemoryOptions(
    selectedPatternPackName,
    stateProps.isEdited,
    defaultPatternPackSelected,
  );
};

export const PatternPackSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PatternPackSelectorComponent);
