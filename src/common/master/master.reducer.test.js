import {
  masterInitialState,
  masterReducer,
  setPattern,
} from './master.reducer';

describe('setPattern', () => {
  test('should change the pattern', () => {
    const state = masterReducer(masterInitialState, setPattern(1));
    expect(state.pattern).toEqual(1);
  });
});
