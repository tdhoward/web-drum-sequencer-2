import React, { useState } from 'react';
import { connect } from 'react-redux';
import { SavePresetModalComponent } from '../SavePresetModal/SavePresetModal.component';
import { savePatternPackModalSelectors } from './SavePatternPackModal.selectors';
import {
  doSavePatternPackAs,
  setPatternPackPrompt,
} from '../../common';
import defaultPatternPacks from '../../patternPacks';
import type { PatternPack } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type SavePatternPackModalDispatchProps = {
  doSavePatternPackAs: (patternPackName: string) => void;
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
  setPatternPackPrompt: (isOpen) => {
    dispatch(setPatternPackPrompt(isOpen));
  },
});

type SavePatternPackModalContainerProps =
  SavePatternPackModalStateProps & SavePatternPackModalDispatchProps;

const SavePatternPackModalContainer = ({
  doSavePatternPackAs: connectedDoSavePatternPackAs,
  patternPackPromptOpen,
  setPatternPackPrompt: connectedSetPatternPackPrompt,
  userPatternPacks = [],
}: SavePatternPackModalContainerProps) => {
  const [nameField, updateNameField] = useState('');
  const [error, setError] = useState<string | null>(null);

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

    if (nameField.length < 1) {
      setError('Min length 1');
    } else if (nameField.length > 32) {
      setError('Max length 32');
    } else if (!isNameUnique(nameField, userPatternPacks)) {
      setError('Must be unique');
    } else {
      connectedSetPatternPackPrompt(false);
      connectedDoSavePatternPackAs(nameField);
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
    />
  );
};

export const SavePatternPackModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SavePatternPackModalContainer);
