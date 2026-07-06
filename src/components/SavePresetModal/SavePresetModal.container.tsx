import React, { useState } from 'react';
import { connect } from 'react-redux';
import { SavePresetModalComponent } from './SavePresetModal.component';
import { savePresetModalSelectors } from './SavePresetModal.selectors';
import {
  setPresetPrompt,
  doSavePresetAs,
} from '../../common';
import defaultPresets from '../../presets';
import type { UserPreset } from '../../common';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type SavePresetModalDispatchProps = {
  setPresetPrompt: (isOpen: boolean) => void;
  doSavePresetAs: (presetName: string) => void;
};

const isNameUnique = (proposedName: string, userPresets: UserPreset[]): boolean => [...defaultPresets, ...userPresets].find(
  preset => preset.name === proposedName,
) === undefined;

const mapStateToProps = (state: RootState) => savePresetModalSelectors(state);

type SavePresetModalStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): SavePresetModalDispatchProps => ({
  setPresetPrompt: (isOpen) => {
    dispatch(setPresetPrompt(isOpen));
  },
  doSavePresetAs: (presetName) => {
    dispatch(doSavePresetAs(presetName) as unknown as AppAction);
  },
});

type SavePresetModalContainerProps = SavePresetModalStateProps & SavePresetModalDispatchProps;

const SavePresetModalContainer = ({
  doSavePresetAs: connectedDoSavePresetAs,
  presetPromptOpen,
  setPresetPrompt: connectedSetPresetPrompt,
  userPresets = [],
}: SavePresetModalContainerProps) => {
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
    connectedSetPresetPrompt(false);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (nameField.length < 1) {
      setError('Min length 1');
    } else if (nameField.length > 32) {
      setError('Max length 32');
    } else if (!isNameUnique(nameField, userPresets)) {
      setError('Must be unique');
    } else {
      connectedSetPresetPrompt(false);
      connectedDoSavePresetAs(nameField);
      updateNameField('');
      setError(null);
    }
  };

  return (
    <SavePresetModalComponent
      error={error}
      nameField={nameField}
      onChangeNameField={onChangeNameField}
      onClose={onClose}
      onSubmit={onSubmit}
      presetPromptOpen={presetPromptOpen}
    />
  );
};

export const SavePresetModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SavePresetModalContainer);
