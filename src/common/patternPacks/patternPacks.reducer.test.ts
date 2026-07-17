import {
  deletePatternPack,
  patternPacksInitialState,
  patternPacksReducer,
  savePatternPack,
  savePatternPackAs,
  renamePatternPack,
} from './patternPacks.reducer';
import type { PatternPack } from '../sequencerModel';

const testPatternPack: PatternPack = {
  id: 'user-test-pack',
  name: 'Test Pack',
  bpm: 120,
  swing: 0.2,
  lanes: [
    {
      id: 'kick',
      laneId: 'kick',
      name: 'Kick',
    },
  ],
  notes: {
    kick: [[]],
  },
};

describe('savePatternPackAs', () => {
  test('adds a new user pattern pack', () => {
    const state = patternPacksReducer(patternPacksInitialState, savePatternPackAs(testPatternPack));
    expect(state.userPatternPacks).toHaveLength(1);
    expect(state.userPatternPacks?.[0]).toEqual(testPatternPack);
  });
});

describe('savePatternPack', () => {
  test('updates an existing user pattern pack', () => {
    const state = patternPacksReducer(patternPacksInitialState, savePatternPackAs(testPatternPack));
    const updatedState = patternPacksReducer(state, savePatternPack({
      ...testPatternPack,
      bpm: 98,
    }));

    expect(updatedState.userPatternPacks).toHaveLength(1);
    expect(updatedState.userPatternPacks?.[0].bpm).toBe(98);
  });
});

describe('deletePatternPack', () => {
  test('removes a user pattern pack', () => {
    const state = patternPacksReducer(patternPacksInitialState, savePatternPackAs(testPatternPack));
    const updatedState = patternPacksReducer(state, deletePatternPack(testPatternPack.id));

    expect(updatedState.userPatternPacks).toHaveLength(0);
  });
});

describe('renamePatternPack', () => {
  test('renames a user pattern pack without changing its ID', () => {
    const state = patternPacksReducer(patternPacksInitialState, savePatternPackAs(testPatternPack));
    const renamedState = patternPacksReducer(state, renamePatternPack({
      id: testPatternPack.id,
      name: 'Renamed Pack',
    }));

    expect(renamedState.userPatternPacks?.[0]).toEqual(expect.objectContaining({
      id: testPatternPack.id,
      name: 'Renamed Pack',
    }));
  });
});
