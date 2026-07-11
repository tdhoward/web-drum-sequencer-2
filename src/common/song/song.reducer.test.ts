import {
  setPattern,
  songInitialState,
  songReducer,
  setArrangementPattern,
  removeArrangementColumn,
  clearArrangementPattern,
} from './song.reducer';
import type { SongState } from '../sequencerModel';

describe('setPattern', () => {
  test('should change the selected pattern', () => {
    const state = songReducer(songInitialState, setPattern(1));
    expect(state.selectedPatternId).toEqual('pattern-1');
  });
});

describe('song arrangement', () => {
  test('appends and replaces pattern columns', () => {
    let state = songReducer(songInitialState, setArrangementPattern({
      columnIndex: 0,
      patternId: 'pattern-2',
    }));
    state = songReducer(state, setArrangementPattern({
      columnIndex: 0,
      patternId: 'pattern-3',
    }));

    expect(state.arrangementPatternIds).toEqual(['pattern-3']);
  });

  test('removes a column and compacts later patterns', () => {
    let state: SongState = {
      ...songInitialState,
      arrangementPatternIds: ['pattern-0', 'pattern-1', 'pattern-2'],
    };
    state = songReducer(state, removeArrangementColumn(1));

    expect(state.arrangementPatternIds).toEqual(['pattern-0', 'pattern-2']);
  });

  test('clears a pattern without removing its column', () => {
    const state = songReducer({
      ...songInitialState,
      arrangementPatternIds: ['pattern-0', 'pattern-1'],
    }, clearArrangementPattern(0));

    expect(state.arrangementPatternIds).toEqual([null, 'pattern-1']);
  });
});
