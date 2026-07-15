import React from 'react';
import { connect } from 'react-redux';
import {
  currentSavedSongStateSelector,
  doSaveSong,
  eraseSong,
  loadSavedSong,
  isCurrentPatternPackEditedSelector,
  selectedSavedSongSelector,
  setSongPrompt,
  startNewSong,
  userSongsSelector,
} from '../../common';
import { deepEqual } from '../../common/presetMemory';
import type { SavedSong } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import {
  PresetSelectorComponent,
  type PresetSelectorCommand,
  type PresetSelectorOption,
} from '../PresetSelector/PresetSelector.component';
import { SaveSongModal } from '../SaveSongModal';
import { clearScheduledNotes } from '../../services/audioScheduler';
import { stopAllNotes } from '../../services/audioRouter';

type Command = 'SAVE_SONG_AS' | 'SAVE_SONG' | 'DELETE_SONG';
type AppAction = Parameters<AppDispatch>[0];
const Selector = PresetSelectorComponent<SavedSong, Command>;

const mapStateToProps = (state: RootState) => {
  const currentSong = currentSavedSongStateSelector(state);
  const selectedSong = selectedSavedSongSelector(state);
  return {
    currentSong,
    selectedSong,
    userSongs: userSongsSelector(state),
    isEdited: selectedSong
      ? !deepEqual(currentSong, selectedSong)
      : currentSong.arrangementPatternIds.length > 0,
    patternPackEdited: isCurrentPatternPackEditedSelector(state),
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  doSaveSong: (id: string) => dispatch(doSaveSong(id) as unknown as AppAction),
  eraseSong: (id: string) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(eraseSong(id) as unknown as AppAction);
  },
  loadSavedSong: (song: SavedSong) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(loadSavedSong(song) as unknown as AppAction);
  },
  startNewSong: () => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(startNewSong() as unknown as AppAction);
  },
  setSongPrompt: (open: boolean) => dispatch(setSongPrompt(open)),
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

const memoryOptions = (
  state: StateProps,
): PresetSelectorCommand<Command>[] => [
  {
    label: state.patternPackEdited ? 'Save Pattern Pack Before Saving Song' : 'Save Song As...',
    value: 'SAVE_SONG_AS',
    disabled: state.patternPackEdited,
  },
  {
    label: `Save "${state.selectedSong?.name || state.currentSong.name}"`,
    value: 'SAVE_SONG',
    disabled: state.patternPackEdited || !state.selectedSong || !state.isEdited,
  },
  {
    label: `Delete "${state.selectedSong?.name || state.currentSong.name}"`,
    value: 'DELETE_SONG',
    disabled: !state.selectedSong,
  },
];

const mergeProps = (state: StateProps, actions: DispatchProps) => {
  const blankSong: SavedSong = {
    id: 'song-1',
    name: 'Untitled Song',
    patternPackId: state.currentSong.patternPackId,
    arrangementPatternIds: [],
  };
  return {
    ariaLabel: 'Select Song',
    currentPreset: state.selectedSong || blankSong,
    getPresetId: (song: SavedSong) => song.id,
    isEdited: state.isEdited,
    label: 'SONG',
    memoryOptions: memoryOptions(state),
    modal: React.createElement(SaveSongModal),
    presets: [blankSong],
    userPresets: state.userSongs,
    onSelectPreset: ({ value }: PresetSelectorOption<SavedSong, Command>) => {
      if (value === 'SAVE_SONG_AS') actions.setSongPrompt(true);
      else if (value === 'SAVE_SONG' && state.selectedSong) actions.doSaveSong(state.selectedSong.id);
      else if (value === 'DELETE_SONG' && state.selectedSong) actions.eraseSong(state.selectedSong.id);
      else if (typeof value !== 'string') {
        if (value.id === blankSong.id) actions.startNewSong();
        else actions.loadSavedSong(value);
      }
    },
  };
};

export const SongPresetSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(Selector);
