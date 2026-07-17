import {
  deleteSong,
  saveSong,
  saveSongAs,
  renameSong,
  songLibraryInitialState,
  songLibraryReducer,
} from './songLibrary.reducer';

const savedSong = {
  id: 'user-test-song',
  name: 'Test Song',
  selectedKitId: 'test-kit',
  patternPackId: 'hip-hop',
  arrangementPatternIds: [['pattern-0', 'pattern-2']],
};

describe('song library', () => {
  test('saves and updates a user song', () => {
    let state = songLibraryReducer(songLibraryInitialState, saveSongAs(savedSong));
    state = songLibraryReducer(state, saveSong({
      ...savedSong,
      arrangementPatternIds: [['pattern-1']],
    }));

    expect(state.selectedSongId).toBe(savedSong.id);
    expect(state.userSongs[0].arrangementPatternIds).toEqual([['pattern-1']]);
  });

  test('deletes a selected user song', () => {
    let state = songLibraryReducer(songLibraryInitialState, saveSongAs(savedSong));
    state = songLibraryReducer(state, deleteSong(savedSong.id));

    expect(state.userSongs).toEqual([]);
    expect(state.selectedSongId).toBeUndefined();
  });

  test('renames a user song without changing its ID', () => {
    const state = songLibraryReducer(songLibraryInitialState, saveSongAs(savedSong));
    const renamedState = songLibraryReducer(state, renameSong({
      id: savedSong.id,
      name: 'Renamed Song',
    }));

    expect(renamedState.selectedSongId).toBe(savedSong.id);
    expect(renamedState.userSongs[0]).toEqual(expect.objectContaining({
      id: savedSong.id,
      name: 'Renamed Song',
    }));
  });
});
