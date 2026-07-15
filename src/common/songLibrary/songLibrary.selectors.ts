import { createSelector } from 'reselect';
import { selectedPatternPackIdSelector } from '../patternPacks';
import { songSelector } from '../song';
import type { SavedSong } from '../sequencerModel';
import type { SongLibraryState } from './songLibrary.reducer';

type SongLibraryRootState = {
  songLibrary?: SongLibraryState;
} & Parameters<typeof songSelector>[0] & Parameters<typeof selectedPatternPackIdSelector>[0];

export const userSongsSelector = (state: SongLibraryRootState): SavedSong[] => (
  state.songLibrary?.userSongs || []
);

export const selectedSongIdSelector = (state: SongLibraryRootState): string | undefined => (
  state.songLibrary?.selectedSongId
);

export const selectedSavedSongSelector = createSelector(
  selectedSongIdSelector,
  userSongsSelector,
  (selectedSongId, userSongs) => userSongs.find(song => song.id === selectedSongId),
);

export const currentSavedSongStateSelector = createSelector(
  songSelector,
  selectedPatternPackIdSelector,
  (song, selectedPatternPackId): SavedSong => ({
    id: song.id,
    name: song.name,
    selectedKitId: song.selectedKitId,
    patternPackId: selectedPatternPackId || song.patternPackId || '',
    arrangementPatternIds: song.arrangementPatternIds || [],
    tempoChanges: song.tempoChanges || [],
  }),
);
