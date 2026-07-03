import {
  setPattern,
  songInitialState,
  songReducer,
} from './song.reducer';

describe('setPattern', () => {
  test('should change the selected pattern', () => {
    const state = songReducer(songInitialState, setPattern(1));
    expect(state.selectedPatternId).toEqual('pattern-1');
  });
});
