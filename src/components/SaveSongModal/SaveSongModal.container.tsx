import React, { useState } from 'react';
import { connect } from 'react-redux';
import { doSaveSongAs, setSongPrompt, songPromptOpenSelector, userSongsSelector } from '../../common';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import { SavePresetModalComponent } from '../SavePresetModal/SavePresetModal.component';

type AppAction = Parameters<AppDispatch>[0];

const mapStateToProps = (state: RootState) => ({
  open: songPromptOpenSelector(state),
  userSongs: userSongsSelector(state),
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  save: (name: string) => dispatch(doSaveSongAs(name) as unknown as AppAction),
  setOpen: (open: boolean) => dispatch(setSongPrompt(open)),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const SaveSongModalContainer = ({ open, userSongs, save, setOpen }: Props) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    setName('');
    setError(null);
    setOpen(false);
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) setError('Min length 1');
    else if (trimmedName.length > 31) setError('Max length 31');
    else if (userSongs.some(song => song.name === trimmedName)) setError('Must be unique');
    else {
      setOpen(false);
      save(trimmedName);
      setName('');
      setError(null);
    }
  };
  return (
    <SavePresetModalComponent
      error={error}
      inputId="song-name"
      nameField={name}
      nameLabel="Song Name"
      onChangeNameField={(event) => {
        if (event.target.value.length < 32) setName(event.target.value);
        setError(null);
      }}
      onClose={close}
      onSubmit={submit}
      presetPromptOpen={open}
    />
  );
};

export const SaveSongModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SaveSongModalContainer);
