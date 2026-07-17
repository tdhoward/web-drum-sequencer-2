import { doRenameSong, loadSavedSong } from './songLibrary.actions';
import type { SavedSong } from '../sequencerModel';

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

describe('doRenameSong', () => {
  test('renames the library entry and live song by stable ID', () => {
    const actions: DispatchedAction[] = [];
    doRenameSong('user-song', 'Renamed Song')(
      action => actions.push(action as DispatchedAction),
    );
    expect(actions).toEqual([
      {
        type: 'songLibrary/renameSong',
        payload: { id: 'user-song', name: 'Renamed Song' },
      },
      {
        type: 'song/setSongName',
        payload: 'Renamed Song',
      },
    ]);
  });
});

describe('loadSavedSong', () => {
  test('selects the saved kit before loading pattern content', () => {
    const song: SavedSong = {
      id: 'saved-song',
      name: 'Saved Song',
      selectedKitId: 'saved-kit',
      patternPackId: 'empty',
      arrangementPatternIds: [],
    };
    const dispatched: unknown[] = [];
    const state = {
      patternPacks: {
        selectedPatternPackId: 'empty',
        userPatternPacks: [],
      },
    };

    loadSavedSong(song)(
      action => dispatched.push(action),
      () => state as never,
    );

    const actions = dispatched.filter(
      (action): action is DispatchedAction => typeof action !== 'function',
    );
    expect(actions.map(action => action.type)).toEqual([
      'playbackSession/stopPlayback',
      'song/setSelectedKitId',
      'song/loadSong',
      'songLibrary/setSelectedSongId',
    ]);
    expect(actions[1].payload).toBe('saved-kit');
    expect(actions[2].payload).toEqual(expect.objectContaining({
      selectedKitId: 'saved-kit',
    }));
    expect(dispatched.findIndex(action => (
      typeof action !== 'function' && (action as DispatchedAction).type === 'song/setSelectedKitId'
    ))).toBeLessThan(dispatched.findIndex(action => typeof action === 'function'));
  });

  test('finds imported user kits by their explicit kit id', () => {
    const song: SavedSong = {
      id: 'imported-song',
      name: 'Imported Song',
      selectedKitId: 'kit-import-explicit',
      patternPackId: 'empty',
      arrangementPatternIds: [],
    };
    const dispatched: unknown[] = [];
    const state = {
      patternPacks: {
        selectedPatternPackId: 'empty',
        userPatternPacks: [],
      },
      presets: {
        preset: 'Other Kit',
        userPresets: [{
          name: 'Renamed Imported Kit',
          kitId: 'kit-import-explicit',
          channels: [{ id: 'kick', sample: 'kick.wav' }],
        }],
      },
    };

    loadSavedSong(song)(
      action => dispatched.push(action),
      () => state as never,
    );

    expect(dispatched.filter(action => typeof action === 'function')).toHaveLength(2);
  });
});
