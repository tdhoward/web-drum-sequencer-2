import {
  presetsInitialState,
  presetsReducer,
  transformPresetSampleAlignments,
} from './presets.reducer';
import {
  setPreset,
  savePreset,
  savePresetAs,
  deletePreset,
  renamePreset,
} from './presets.actions';

jest.mock('../../presets');
jest.mock('../../services/featureChecks');

const testPreset = {
  name: 'Test preset',
  bpm: 120,
};

describe('setPreset', () => {
  test('should change the preset', () => {
    const state = presetsReducer(presetsInitialState, setPreset('hello'));
    expect(state.preset).toEqual('hello');
  });
});

describe('savePresetAs', () => {
  test('should add a new user preset', () => {
    const state = presetsReducer(presetsInitialState, savePresetAs(testPreset));
    expect(state.userPresets.length).toEqual(1);
  });
});

describe('savePreset', () => {
  test('should update a user preset', () => {
    const state = presetsReducer(presetsInitialState, savePresetAs(testPreset));
    expect(state.userPresets.length).toEqual(1);
    expect(state.userPresets[0].bpm).toEqual(120);
    const newState = presetsReducer(state, savePreset({
      name: 'Test preset',
      bpm: 100,
    }));
    expect(newState.userPresets.length).toEqual(1);
    expect(newState.userPresets[0].bpm).toEqual(100);
  });
});

describe('deletePreset', () => {
  test('should add a new user preset', () => {
    const state = presetsReducer(presetsInitialState, savePresetAs(testPreset));
    expect(state.userPresets.length).toEqual(1);
    const newState = presetsReducer(state, deletePreset('Test preset'));
    expect(newState.userPresets.length).toEqual(0);
  });
});

describe('renamePreset', () => {
  test('renames a user preset and preserves a stable kit ID', () => {
    const state = presetsReducer(
      { ...presetsInitialState, preset: testPreset.name },
      savePresetAs(testPreset),
    );
    const renamedState = presetsReducer(state, renamePreset({
      presetName: testPreset.name,
      name: 'Renamed preset',
      kitId: 'kit-test-preset',
    }));

    expect(renamedState.preset).toBe('Renamed preset');
    expect(renamedState.userPresets[0]).toEqual(expect.objectContaining({
      name: 'Renamed preset',
      kitId: 'kit-test-preset',
    }));
  });
});

describe('transformPresetSampleAlignments', () => {
  test('updates every saved Kit layer using a replacement and invalidates its hash', () => {
    const state = presetsReducer(presetsInitialState, savePresetAs({
      name: 'Layered Kit',
      contentHashAlgorithm: 'sha256',
      contentHashVersion: 1,
      contentHash: 'stale-kit-hash',
      channels: [{
        id: 'snare',
        velocityLayers: [
          {
            id: 'soft',
            sample: 'shared.wav',
            maxVelocity: 63,
            alignmentOffset: 0.1,
          },
          {
            id: 'hard',
            sample: 'shared.wav',
            maxVelocity: 127,
            alignmentOffset: 0.7,
          },
        ],
      }],
    }));
    const transformed = presetsReducer(state, transformPresetSampleAlignments({
      sampleId: 'sample:shared.wav',
      trimStartSeconds: 0.25,
      renderedDuration: 0.4,
    }));
    const [preset] = transformed.userPresets;

    expect(preset.channels?.[0].velocityLayers?.map(layer => layer.alignmentOffset))
      .toEqual([0, 0.4]);
    expect(preset).not.toHaveProperty('contentHash');
    expect(preset).not.toHaveProperty('contentHashAlgorithm');
    expect(preset).not.toHaveProperty('contentHashVersion');
  });
});
