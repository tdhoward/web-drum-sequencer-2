import {
  deleteSong,
  saveSong,
  saveSongAs,
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
});
