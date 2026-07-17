import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  doRenameSong,
  doSaveSongAs,
  selectedSavedSongSelector,
  setSongPrompt,
  songPromptOpenSelector,
  songRenamePromptSelector,
  userSongsSelector,
} from '../../common';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import { SavePresetModalComponent } from '../SavePresetModal/SavePresetModal.component';

type AppAction = Parameters<AppDispatch>[0];

const mapStateToProps = (state: RootState) => ({
  open: songPromptOpenSelector(state),
  renamePrompt: songRenamePromptSelector(state),
  selectedSong: selectedSavedSongSelector(state),
  userSongs: userSongsSelector(state),
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  save: (name: string) => dispatch(doSaveSongAs(name) as unknown as AppAction),
  rename: (id: string, name: string) => (
    dispatch(doRenameSong(id, name) as unknown as AppAction)
  ),
  setOpen: (open: boolean) => dispatch(setSongPrompt(open)),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const SaveSongModalContainer = ({
  open,
  renamePrompt,
  selectedSong,
  userSongs,
  rename,
  save,
  setOpen,
}: Props) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setName(renamePrompt ? selectedSong?.name || '' : '');
      setError(null);
    }
  }, [open, renamePrompt, selectedSong]);
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
    else if (
      (!renamePrompt || trimmedName !== selectedSong?.name)
      && userSongs.some(song => song.name === trimmedName)
    ) setError('Must be unique');
    else {
      setOpen(false);
      if (renamePrompt && selectedSong) rename(selectedSong.id, trimmedName);
      else save(trimmedName);
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
      submitLabel={renamePrompt ? 'RENAME' : 'SAVE'}
    />
  );
};

export const SaveSongModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SaveSongModalContainer);
