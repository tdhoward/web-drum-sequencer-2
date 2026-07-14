import {
  setPattern,
  songInitialState,
  songReducer,
  setArrangementPattern,
  removeArrangementColumn,
  clearArrangementPattern,
  loadSong,
  reorderArrangementColumn,
} from './song.reducer';
import { hasPlayableArrangementSelector } from './song.selectors';
import type { SongState } from '../sequencerModel';

describe('setPattern', () => {
  test('should change the selected pattern', () => {
    const state = songReducer(songInitialState, setPattern(1));
    expect(state.selectedPatternId).toEqual('pattern-1');
  });
});

describe('song arrangement', () => {
  test('appends a column and adds multiple patterns to it', () => {
    let state = songReducer(songInitialState, setArrangementPattern({
      columnIndex: 0,
      patternId: 'pattern-2',
    }));
    state = songReducer(state, setArrangementPattern({
      columnIndex: 0,
      patternId: 'pattern-3',
    }));

    expect(state.arrangementPatternIds).toEqual([['pattern-2', 'pattern-3']]);
  });

  test('does not add the same pattern to a column twice', () => {
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds: [['pattern-2']],
    }, setArrangementPattern({ columnIndex: 0, patternId: 'pattern-2' }));

    expect(state.arrangementPatternIds).toEqual([['pattern-2']]);
  });

  test('removes a column and compacts later patterns', () => {
    let state: SongState = {
      ...songInitialState,
      arrangementPatternIds: [['pattern-0'], ['pattern-1'], ['pattern-2']],
    };
    state = songReducer(state, removeArrangementColumn(1));

    expect(state.arrangementPatternIds).toEqual([['pattern-0'], ['pattern-2']]);
  });

  test('removes only the selected pattern without removing its column', () => {
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds: [['pattern-0', 'pattern-2'], ['pattern-1']],
    }, clearArrangementPattern({ columnIndex: 0, patternId: 'pattern-0' }));

    expect(state.arrangementPatternIds).toEqual([['pattern-2'], ['pattern-1']]);
  });

  test('preserves a silent column when its last pattern is removed', () => {
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds: [['pattern-0'], ['pattern-1']],
    }, clearArrangementPattern({ columnIndex: 0, patternId: 'pattern-0' }));

    expect(state.arrangementPatternIds).toEqual([[], ['pattern-1']]);
  });

  test('reorders persisted arrangement columns', () => {
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds: [['pattern-0', 'pattern-3'], ['pattern-1'], ['pattern-2']],
    }, reorderArrangementColumn({ oldIndex: 2, newIndex: 0 }));

    expect(state.arrangementPatternIds).toEqual([
      ['pattern-2'],
      ['pattern-0', 'pattern-3'],
      ['pattern-1'],
    ]);
  });

  test('turns the derived final column into an arranged empty column when moved', () => {
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds: [['pattern-0'], ['pattern-1']],
    }, reorderArrangementColumn({ oldIndex: 2, newIndex: 1 }));

    expect(state.arrangementPatternIds).toEqual([['pattern-0'], [], ['pattern-1']]);
  });

  test('keeps a new derived final column when a pattern is moved after it', () => {
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds: [['pattern-0'], ['pattern-1']],
    }, reorderArrangementColumn({ oldIndex: 0, newIndex: 2 }));

    expect(state.arrangementPatternIds).toEqual([['pattern-1'], [], ['pattern-0']]);
  });

  test('does not persist the derived final column when it is not moved', () => {
    const arrangementPatternIds = [['pattern-0'], ['pattern-1']];
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds,
    }, reorderArrangementColumn({ oldIndex: 2, newIndex: 2 }));

    expect(state.arrangementPatternIds).toEqual(arrangementPatternIds);
  });

  test('loads valid multi-pattern selections and preserves empty columns', () => {
    const state = songReducer(songInitialState, loadSong({
      id: 'saved-song',
      name: 'Saved Song',
      patternPackId: 'test-pack',
      arrangementPatternIds: [['pattern-0', 'missing-pattern', 'pattern-2'], []],
    }));

    expect(state.arrangementPatternIds).toEqual([['pattern-0', 'pattern-2'], []]);
  });
});

describe('hasPlayableArrangementSelector', () => {
  test('requires at least one selected pattern rather than only a stored column', () => {
    expect(hasPlayableArrangementSelector({
      song: { ...songInitialState, arrangementPatternIds: [[], []] },
    })).toBe(false);
    expect(hasPlayableArrangementSelector({
      song: { ...songInitialState, arrangementPatternIds: [[], ['pattern-1']] },
    })).toBe(true);
  });
});
