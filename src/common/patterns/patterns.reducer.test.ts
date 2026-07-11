import {
  replacePatternSettings,
  setPatternTimeSignature,
  patternsReducer,
} from './patterns.reducer';
import {
  DEFAULT_PATTERN_SETTINGS,
  createPatternsState,
} from '../sequencerModel';

jest.mock('../../presets');
jest.mock('../../samples.config');

describe('setPatternTimeSignature', () => {
  test('updates the requested pattern timing without changing other pattern metadata', () => {
    const initialState = createPatternsState({
      patternCount: 2,
      laneIds: ['kick'],
    });

    const state = patternsReducer(initialState, setPatternTimeSignature({
      patternId: 'pattern-1',
      timeSignature: {
        beatsPerBar: 6,
        beatUnit: 8,
      },
      stepsPerBeat: 2,
    }));

    expect(state.entities['pattern-0']).toEqual(initialState.entities['pattern-0']);
    expect(state.entities['pattern-1']).toEqual({
      ...initialState.entities['pattern-1'],
      timeSignature: {
        beatsPerBar: 6,
        beatUnit: 8,
      },
      stepsPerBeat: 2,
    });
  });
});

describe('replacePatternSettings', () => {
  test('normalizes missing settings back to the default pattern settings', () => {
    const initialState = createPatternsState({
      patternCount: 2,
      laneIds: ['kick'],
    });

    const state = patternsReducer(initialState, replacePatternSettings([
      {
        timeSignature: {
          beatsPerBar: 3,
          beatUnit: 4,
        },
        bars: 1,
        stepsPerBeat: 4,
      },
    ]));

    expect(state.entities['pattern-0']).toEqual({
      ...initialState.entities['pattern-0'],
      timeSignature: {
        beatsPerBar: 3,
        beatUnit: 4,
      },
      stepsPerBeat: 4,
    });
    expect(state.entities['pattern-1']).toEqual({
      ...initialState.entities['pattern-1'],
      ...DEFAULT_PATTERN_SETTINGS,
    });
  });
});
