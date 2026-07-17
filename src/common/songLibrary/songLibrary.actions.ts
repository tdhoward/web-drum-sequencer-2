import patternPacks from '../../patternPacks';
import kitPresets from '../../presets';
import { loadPatternPack } from '../patternPacks';
import { loadSong, setSelectedKitId, setSongName } from '../song';
import { stopPlayback } from '../playbackSession';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import type { SavedSong } from '../sequencerModel';
import {
  currentSavedSongStateSelector,
  userSongsSelector,
} from './songLibrary.selectors';
import {
  deleteSong,
  renameSong,
  saveSong,
  saveSongAs,
  setSelectedSongId,
} from './songLibrary.reducer';
import { allPatternPacksSelector } from '../patternPacks';
import {
  currentKitPresetStateSelector,
  loadPreset,
  userPresetsSelector,
} from '../presets';
import { kitIdFromPresetName } from '../kits';
import {
  calculatePatternPackContentHash,
  calculateSongContentHash,
} from '../contentHash';
import { calculateKitPresetContentHash } from '../../services/libraryContentHash';

type Dispatch = (action: unknown) => void;
type SongMemoryState = Parameters<typeof currentSavedSongStateSelector>[0]
  & Parameters<typeof userSongsSelector>[0]
  & Parameters<typeof allPatternPacksSelector>[0]
  & Parameters<typeof currentKitPresetStateSelector>[0]
  & Parameters<typeof userPresetsSelector>[0];

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
): Promise<void> => {
  const state = getState();
  const song: SavedSong = {
    ...currentSavedSongStateSelector(state),
    id: createSongId(name, userSongsSelector(state)),
    name,
  };
  const patternPack = allPatternPacksSelector(state).find(
    candidate => candidate.id === song.patternPackId,
  );
  if (!patternPack) return Promise.resolve();

  return Promise.all([
    calculateKitPresetContentHash(currentKitPresetStateSelector(state)),
    calculatePatternPackContentHash(patternPack),
  ]).then(async ([kitResult, patternPackHash]) => {
    const songWithDependencies: SavedSong = {
      ...song,
      kitContentHash: kitResult.hash.contentHash,
      patternPackContentHash: patternPackHash.contentHash,
    };
    const songHash = await calculateSongContentHash({
      song: songWithDependencies,
      kitContentHash: kitResult.hash.contentHash,
      patternPack,
      patternPackContentHash: patternPackHash.contentHash,
    });
    const hashedSong = { ...songWithDependencies, ...songHash };
    dispatch(saveSongAs(hashedSong));
    dispatch(loadSong(hashedSong));
    dispatch(showFlashMessage(FLASH_MESSAGES.SONG_SAVED));
  });
};

export const doSaveSong = (songId: string) => (
  dispatch: Dispatch,
  getState: () => SongMemoryState,
): Promise<void> => {
  const state = getState();
  const existingSong = userSongsSelector(state).find(song => song.id === songId);
  if (!existingSong) return Promise.resolve();
  const song: SavedSong = {
    ...currentSavedSongStateSelector(state),
    id: existingSong.id,
    name: existingSong.name,
  };
  const patternPack = allPatternPacksSelector(state).find(
    candidate => candidate.id === song.patternPackId,
  );
  if (!patternPack) return Promise.resolve();

  return Promise.all([
    calculateKitPresetContentHash(currentKitPresetStateSelector(state)),
    calculatePatternPackContentHash(patternPack),
  ]).then(async ([kitResult, patternPackHash]) => {
    const songWithDependencies: SavedSong = {
      ...song,
      kitContentHash: kitResult.hash.contentHash,
      patternPackContentHash: patternPackHash.contentHash,
    };
    const songHash = await calculateSongContentHash({
      song: songWithDependencies,
      kitContentHash: kitResult.hash.contentHash,
      patternPack,
      patternPackContentHash: patternPackHash.contentHash,
    });
    const hashedSong = { ...songWithDependencies, ...songHash };
    dispatch(saveSong(hashedSong));
    dispatch(loadSong(hashedSong));
    dispatch(showFlashMessage(FLASH_MESSAGES.SONG_SAVED));
  });
};

export const loadSavedSong = (song: SavedSong) => (
  dispatch: Dispatch,
  getState: () => SongMemoryState,
): void => {
  const patternPack = allPatternPacksSelector(getState()).find(pack => pack.id === song.patternPackId)
    || patternPacks[0];
  if (!patternPack) return;
  stopForSongChange(dispatch);
  dispatch(setSelectedKitId(song.selectedKitId));
  const kitPreset = [...kitPresets, ...(userPresetsSelector(getState()) || [])].find(
    preset => (
      ('kitId' in preset && preset.kitId) || kitIdFromPresetName(preset.name)
    ) === song.selectedKitId,
  );
  if (kitPreset) {
    dispatch(loadPreset(kitPreset as Parameters<typeof loadPreset>[0]));
  }
  dispatch(loadPatternPack(patternPack));
  dispatch(loadSong({
    ...song,
    patternPackId: patternPack.id,
    fallbackBpm: patternPack.bpm,
  }));
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
    selectedKitId: current.selectedKitId,
    patternPackId: current.patternPackId,
    arrangementPatternIds: [],
    tempoChanges: [],
  }));
  dispatch(setSelectedSongId(undefined));
};

export const eraseSong = (songId: string) => (dispatch: Dispatch): void => {
  dispatch(deleteSong(songId));
  dispatch(startNewSong());
  dispatch(showFlashMessage(FLASH_MESSAGES.SONG_DELETED));
};

export const doRenameSong = (songId: string, name: string) => (
  dispatch: Dispatch,
): void => {
  dispatch(renameSong({ id: songId, name }));
  dispatch(setSongName(name));
};
