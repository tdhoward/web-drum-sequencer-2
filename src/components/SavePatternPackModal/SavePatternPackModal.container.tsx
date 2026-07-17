import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { SavePresetModalComponent } from '../SavePresetModal/SavePresetModal.component';
import { savePatternPackModalSelectors } from './SavePatternPackModal.selectors';
import {
  doSavePatternPackAs,
  doRenamePatternPack,
  setPatternPackPrompt,
} from '../../common';
import defaultPatternPacks from '../../patternPacks';
import type { PatternPack } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type SavePatternPackModalDispatchProps = {
  doSavePatternPackAs: (patternPackName: string) => void;
  doRenamePatternPack: (patternPackId: string, name: string) => void;
  setPatternPackPrompt: (isOpen: boolean) => void;
};

const isNameUnique = (proposedName: string, userPatternPacks: PatternPack[]): boolean => (
  [...defaultPatternPacks, ...userPatternPacks].find(
    patternPack => patternPack.name === proposedName,
  ) === undefined
);

const mapStateToProps = (state: RootState) => savePatternPackModalSelectors(state);

type SavePatternPackModalStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): SavePatternPackModalDispatchProps => ({
  doSavePatternPackAs: (patternPackName) => {
    dispatch(doSavePatternPackAs(patternPackName) as unknown as AppAction);
  },
  doRenamePatternPack: (patternPackId, name) => {
    dispatch(doRenamePatternPack(patternPackId, name) as unknown as AppAction);
  },
  setPatternPackPrompt: (isOpen) => {
    dispatch(setPatternPackPrompt(isOpen));
  },
});

type SavePatternPackModalContainerProps =
  SavePatternPackModalStateProps & SavePatternPackModalDispatchProps;

const SavePatternPackModalContainer = ({
  doSavePatternPackAs: connectedDoSavePatternPackAs,
  doRenamePatternPack: connectedDoRenamePatternPack,
  patternPackPromptOpen,
  renamePrompt,
  selectedPatternPack,
  setPatternPackPrompt: connectedSetPatternPackPrompt,
  userPatternPacks = [],
}: SavePatternPackModalContainerProps) => {
  const [nameField, updateNameField] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patternPackPromptOpen) {
      updateNameField(renamePrompt ? selectedPatternPack?.name || '' : '');
      setError(null);
    }
  }, [patternPackPromptOpen, renamePrompt, selectedPatternPack]);

  const onChangeNameField = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.length < 32) {
      updateNameField(event.target.value);
      setError(null);
    }
  };

  const onClose = () => {
    updateNameField('');
    connectedSetPatternPackPrompt(false);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = nameField.trim();

    if (trimmedName.length < 1) {
      setError('Min length 1');
    } else if (trimmedName.length > 31) {
      setError('Max length 31');
    } else if (
      (!renamePrompt || trimmedName !== selectedPatternPack?.name)
      && !isNameUnique(trimmedName, userPatternPacks)
    ) {
      setError('Must be unique');
    } else {
      connectedSetPatternPackPrompt(false);
      if (renamePrompt && selectedPatternPack) {
        connectedDoRenamePatternPack(selectedPatternPack.id, trimmedName);
      } else {
        connectedDoSavePatternPackAs(trimmedName);
      }
      updateNameField('');
      setError(null);
    }
  };

  return (
    <SavePresetModalComponent
      error={error}
      inputId="pattern-pack-name"
      nameField={nameField}
      nameLabel="Pattern Pack Name"
      onChangeNameField={onChangeNameField}
      onClose={onClose}
      onSubmit={onSubmit}
      presetPromptOpen={patternPackPromptOpen}
      submitLabel={renamePrompt ? 'RENAME' : 'SAVE'}
    />
  );
};

export const SavePatternPackModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SavePatternPackModalContainer);
