import React from 'react';
import { connect } from 'react-redux';
import {
  currentSavedSongStateSelector,
  doSaveSong,
  eraseSong,
  exportCurrentSong,
  importSongFile,
  loadSavedSong,
  isCurrentPatternPackEditedSelector,
  selectedSavedSongSelector,
  setSongPrompt,
  setSongRenamePrompt,
  startNewSong,
  userSongsSelector,
} from '../../common';
import { deepEqual, omitFields } from '../../common/presetMemory';
import type { SavedSong } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import {
  PresetSelectorComponent,
  type PresetSelectorOption,
} from '../PresetSelector/PresetSelector.component';
import { SaveSongModal } from '../SaveSongModal';
import { clearScheduledNotes } from '../../services/audioScheduler';
import { stopAllNotes } from '../../services/audioRouter';
import { openSongFilePicker } from '../../services/songFiles';
import {
  createSongMemoryOptions,
  type SongPresetCommand,
} from './SongPresetSelector.commands';
import { isCurrentKitEditedSelector } from '../PresetSelector/PresetSelector.selectors';
import {
  confirmUnsavedSwitch,
  type UnsavedContent,
} from '../confirmUnsavedSwitch';

type AppAction = Parameters<AppDispatch>[0];
const Selector = PresetSelectorComponent<SavedSong, SongPresetCommand>;
const derivedHashFields = new Set([
  'contentHash',
  'contentHashAlgorithm',
  'contentHashVersion',
  'kitContentHash',
  'patternPackContentHash',
]);

const mapStateToProps = (state: RootState) => {
  const currentSong = currentSavedSongStateSelector(state);
  const selectedSong = selectedSavedSongSelector(state);
  return {
    currentSong,
    selectedSong,
    userSongs: userSongsSelector(state),
    isEdited: selectedSong
      ? !deepEqual(currentSong, omitFields(selectedSong, derivedHashFields))
      : currentSong.arrangementPatternIds.length > 0,
    kitEdited: isCurrentKitEditedSelector(state),
    patternPackEdited: isCurrentPatternPackEditedSelector(state),
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  doSaveSong: (id: string) => dispatch(doSaveSong(id) as unknown as AppAction),
  exportSong: () => dispatch(exportCurrentSong() as unknown as AppAction),
  importSong: (file: File) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(importSongFile(file) as unknown as AppAction);
  },
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
  setSongRenamePrompt: (open: boolean) => dispatch(setSongRenamePrompt(open)),
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

const mergeProps = (state: StateProps, actions: DispatchProps) => {
  const blankSong: SavedSong = {
    id: 'song-1',
    name: 'Untitled Song',
    selectedKitId: state.currentSong.selectedKitId,
    patternPackId: state.currentSong.patternPackId,
    arrangementPatternIds: [],
  };
  const editedContent: UnsavedContent[] = [
    ...(state.kitEdited ? ['kit' as const] : []),
    ...(state.patternPackEdited ? ['pattern pack' as const] : []),
    ...(state.isEdited ? ['song' as const] : []),
  ];
  return {
    ariaLabel: 'Select Song',
    currentPreset: state.selectedSong || blankSong,
    getPresetId: (song: SavedSong) => song.id,
    isEdited: state.isEdited,
    label: 'SONG',
    memoryGroupLabel: 'Current Song',
    memoryOptions: createSongMemoryOptions({
      hasSelectedSong: Boolean(state.selectedSong),
      isEdited: state.isEdited,
      kitEdited: state.kitEdited,
      patternPackEdited: state.patternPackEdited,
    }),
    modal: React.createElement(SaveSongModal),
    presets: [blankSong],
    userPresets: state.userSongs,
    onSelectPreset: ({ value }: PresetSelectorOption<SavedSong, SongPresetCommand>) => {
      if (value === 'SAVE_SONG_AS') actions.setSongPrompt(true);
      else if (value === 'SAVE_SONG' && state.selectedSong) actions.doSaveSong(state.selectedSong.id);
      else if (value === 'RENAME_SONG') actions.setSongRenamePrompt(true);
      else if (value === 'EXPORT_SONG') actions.exportSong();
      else if (value === 'IMPORT_SONG') {
        openSongFilePicker((file) => {
          if (confirmUnsavedSwitch(editedContent)) actions.importSong(file);
        });
      }
      else if (value === 'DELETE_SONG' && state.selectedSong) actions.eraseSong(state.selectedSong.id);
      else if (typeof value !== 'string') {
        if (value.id === blankSong.id) {
          if (confirmUnsavedSwitch(state.isEdited ? ['song'] : [])) actions.startNewSong();
        } else if (
          value.id !== state.selectedSong?.id
          && confirmUnsavedSwitch(editedContent)
        ) actions.loadSavedSong(value);
      }
    },
  };
};

export const SongPresetSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(Selector);
