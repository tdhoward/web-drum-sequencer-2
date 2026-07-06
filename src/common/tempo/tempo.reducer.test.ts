import {
  tempoInitialState,
  tempoReducer,
  setBPM,
  setHumanize,
  setSwing,
} from './tempo.reducer';

jest.mock('../../presets');

describe('setBPM', () => {
  test('should set bpm', () => {
    const state = tempoReducer(tempoInitialState, setBPM(123));
    expect(state.bpm).toBe(123);
  });
});

describe('setSwing', () => {
  test('should set swing', () => {
    const state = tempoReducer(tempoInitialState, setSwing(0.4));
    expect(state.swing).toBe(0.4);
  });
});

describe('setHumanize', () => {
  test('should set humanize', () => {
    const state = tempoReducer(tempoInitialState, setHumanize(0.5));
    expect(state.humanize).toBe(0.5);
  });
});
