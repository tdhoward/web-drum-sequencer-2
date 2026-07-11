import patternPacks from '../../patternPacks';
import { loadPatternPack } from '../patternPacks';
import { loadSong } from '../song';
import { stopPlayback } from '../playbackSession';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import type { SavedSong } from '../sequencerModel';
import {
  currentSavedSongStateSelector,
  userSongsSelector,
} from './songLibrary.selectors';
import {
  deleteSong,
  saveSong,
  saveSongAs,
  setSelectedSongId,
} from './songLibrary.reducer';
import { allPatternPacksSelector } from '../patternPacks';

type Dispatch = (action: unknown) => void;
type SongMemoryState = Parameters<typeof currentSavedSongStateSelector>[0]
  & Parameters<typeof userSongsSelector>[0]
  & Parameters<typeof allPatternPacksSelector>[0];

const stopForSongChange = (dispatch: Dispatch): void => {
  dispatch(stopPlayback());
};

const slugify = (value: string): string => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const createSongId = (name: string, songs: SavedSong[]): string => {
  const baseId = `user-${slugify(name) || 'song'}`;
  const ids = new Set(songs.map(song => song.id));
  let id = baseId;
  let suffix = 2;
  while (ids.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return id;
};

export const doSaveSongAs = (name: string) => (
  dispatch: Dispatch,
  getState: () => SongMemoryState,
): void => {
  const state = getState();
  const song = {
    ...currentSavedSongStateSelector(state),
    id: createSongId(name, userSongsSelector(state)),
    name,
  };
  dispatch(saveSongAs(song));
  dispatch(loadSong(song));
  dispatch(showFlashMessage(FLASH_MESSAGES.SONG_SAVED));
};

export const doSaveSong = (songId: string) => (
  dispatch: Dispatch,
  getState: () => SongMemoryState,
): void => {
  const state = getState();
  const existingSong = userSongsSelector(state).find(song => song.id === songId);
  if (!existingSong) return;
  const song = {
    ...currentSavedSongStateSelector(state),
    id: existingSong.id,
    name: existingSong.name,
  };
  dispatch(saveSong(song));
  dispatch(loadSong(song));
  dispatch(showFlashMessage(FLASH_MESSAGES.SONG_SAVED));
};

export const loadSavedSong = (song: SavedSong) => (
  dispatch: Dispatch,
  getState: () => SongMemoryState,
): void => {
  const patternPack = allPatternPacksSelector(getState()).find(pack => pack.id === song.patternPackId)
    || patternPacks[0];
  if (!patternPack) return;
  stopForSongChange(dispatch);
  dispatch(loadPatternPack(patternPack));
  dispatch(loadSong({ ...song, patternPackId: patternPack.id }));
  dispatch(setSelectedSongId(song.id));
};

export const startNewSong = () => (
  dispatch: Dispatch,
  getState: () => SongMemoryState,
): void => {
  const current = currentSavedSongStateSelector(getState());
  stopForSongChange(dispatch);
  dispatch(loadSong({
    id: 'song-1',
    name: 'Untitled Song',
    patternPackId: current.patternPackId,
    arrangementPatternIds: [],
  }));
  dispatch(setSelectedSongId(undefined));
};

export const eraseSong = (songId: string) => (dispatch: Dispatch): void => {
  dispatch(deleteSong(songId));
  dispatch(startNewSong());
  dispatch(showFlashMessage(FLASH_MESSAGES.SONG_DELETED));
};
