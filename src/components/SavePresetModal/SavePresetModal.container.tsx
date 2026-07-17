import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { SavePresetModalComponent } from './SavePresetModal.component';
import { savePresetModalSelectors } from './SavePresetModal.selectors';
import {
  setPresetPrompt,
  doSavePresetAs,
  doRenamePreset,
} from '../../common';
import defaultPresets from '../../presets';
import type { UserPreset } from '../../common';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type SavePresetModalDispatchProps = {
  setPresetPrompt: (isOpen: boolean) => void;
  doSavePresetAs: (presetName: string) => void;
  doRenamePreset: (presetName: string, name: string) => void;
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
  doRenamePreset: (presetName, name) => {
    dispatch(doRenamePreset(presetName, name) as unknown as AppAction);
  },
});

type SavePresetModalContainerProps = SavePresetModalStateProps & SavePresetModalDispatchProps;

const SavePresetModalContainer = ({
  doSavePresetAs: connectedDoSavePresetAs,
  doRenamePreset: connectedDoRenamePreset,
  presetPromptOpen,
  renamePrompt,
  selectedPresetName,
  setPresetPrompt: connectedSetPresetPrompt,
  userPresets = [],
}: SavePresetModalContainerProps) => {
  const [nameField, updateNameField] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (presetPromptOpen) {
      updateNameField(renamePrompt ? selectedPresetName || '' : '');
      setError(null);
    }
  }, [presetPromptOpen, renamePrompt, selectedPresetName]);

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
    const trimmedName = nameField.trim();

    if (trimmedName.length < 1) {
      setError('Min length 1');
    } else if (trimmedName.length > 31) {
      setError('Max length 31');
    } else if (
      (!renamePrompt || trimmedName !== selectedPresetName)
      && !isNameUnique(trimmedName, userPresets)
    ) {
      setError('Must be unique');
    } else {
      connectedSetPresetPrompt(false);
      if (renamePrompt && selectedPresetName) {
        connectedDoRenamePreset(selectedPresetName, trimmedName);
      } else {
        connectedDoSavePresetAs(trimmedName);
      }
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
      submitLabel={renamePrompt ? 'RENAME' : 'SAVE'}
    />
  );
};

export const SavePresetModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SavePresetModalContainer);
