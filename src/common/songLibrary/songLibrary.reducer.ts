import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SavedSong } from '../sequencerModel';

export type SongLibraryState = {
  selectedSongId?: string;
  userSongs: SavedSong[];
};

export const songLibraryInitialState: SongLibraryState = {
  userSongs: [],
};

export const songLibrarySlice = createSlice({
  name: 'songLibrary',
  initialState: songLibraryInitialState,
  reducers: {
    setSelectedSongId(state, action: PayloadAction<string | undefined>) {
      state.selectedSongId = action.payload;
    },
    saveSongAs(state, action: PayloadAction<SavedSong>) {
      state.userSongs = [
        ...state.userSongs.filter(song => song.id !== action.payload.id),
        action.payload,
      ];
      state.selectedSongId = action.payload.id;
    },
    saveSong(state, action: PayloadAction<SavedSong>) {
      state.userSongs = state.userSongs.map(song => (
        song.id === action.payload.id ? action.payload : song
      ));
    },
    renameSong(state, action: PayloadAction<{ id: string; name: string }>) {
      const song = state.userSongs.find(userSong => userSong.id === action.payload.id);
      if (song) song.name = action.payload.name;
    },
    deleteSong(state, action: PayloadAction<string>) {
      state.userSongs = state.userSongs.filter(song => song.id !== action.payload);
      if (state.selectedSongId === action.payload) {
        state.selectedSongId = undefined;
      }
    },
  },
});

export const {
  setSelectedSongId,
  saveSongAs,
  saveSong,
  renameSong,
  deleteSong,
} = songLibrarySlice.actions;

export const songLibraryReducer = songLibrarySlice.reducer;
