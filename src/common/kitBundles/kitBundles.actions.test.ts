import {
  downloadKitFile,
  readKitFile,
} from '../../services/kitFiles';
import {
  getSampleBytes,
  saveImportedSampleBytes,
} from '../../services/sampleStore';
import { normalizeKitChannelsState } from '../sequencerModel';
import type { Kit, Sample } from '../sequencerModel';
import type { UserPreset } from '../presets';
import {
  createKitExportBundle,
  serializeKitExportBundle,
} from './kitBundles';
import { exportSelectedKit, importKitFile } from './kitBundles.actions';

jest.mock('../../services/featureChecks');
jest.mock('../../services/kitFiles', () => ({
  downloadKitFile: jest.fn(),
  kitFileName: jest.fn(() => 'test-kit.wds-kit'),
  readKitFile: jest.fn(),
}));
jest.mock('../../services/sampleStore', () => ({
  getSampleBytes: jest.fn(),
  getSampleFingerprint: jest.fn(),
  loadSample: jest.fn(() => Promise.resolve(true)),
  saveImportedSampleBytes: jest.fn(() => Promise.resolve()),
}));

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

const createBundle = async () => {
  const channels = normalizeKitChannelsState([{
    id: 'exported-kick',
    name: 'Exported Kick',
    sample: 'exported-kick.wav',
    percussionType: 'bass_drum',
    gain: 1,
  }], 'exported-kit');
  const channel = channels.entities['exported-kick'];
  const kit: Kit = {
    id: 'exported-kit',
    name: 'Travel Kit',
    channelIds: [channel.id],
  };
  const sample: Sample = {
    id: channel.velocityLayers[0].sampleId,
    name: 'Exported Kick',
    url: 'exported-kick.wav',
    sourceType: 'user',
  };
  return createKitExportBundle({
    kit,
    channels: [channel],
    samples: { [sample.id]: sample },
    getSampleBytes: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
  });
};

const createLayeredBundle = async () => {
  const channels = normalizeKitChannelsState([{
    id: 'exported-snare',
    name: 'Exported Snare',
    percussionType: 'snare_drum',
    velocityLayers: [
      {
        id: 'soft',
        sample: 'shared-snare.wav',
        maxVelocity: 55,
        alignmentOffset: 0.01,
        trimDb: -3,
      },
      {
        id: 'medium',
        sample: 'medium-snare.wav',
        maxVelocity: 100,
        alignmentOffset: 0.02,
        trimDb: 0,
      },
      {
        id: 'hard',
        sample: 'shared-snare.wav',
        maxVelocity: 127,
        alignmentOffset: 0.03,
        trimDb: -1,
      },
    ],
  }], 'exported-layered-kit');
  const channel = channels.entities['exported-snare'];
  const kit: Kit = {
    id: 'exported-layered-kit',
    name: 'Layered Travel Kit',
    channelIds: [channel.id],
  };
  const samples = channel.velocityLayers.reduce<Record<string, Sample>>((result, layer) => {
    const url = layer.sampleId.replace(/^sample:/, '');
    result[layer.sampleId] = {
      id: layer.sampleId,
      name: url,
      url,
      sourceType: 'user',
    };
    return result;
  }, {});
  return createKitExportBundle({
    kit,
    channels: [channel],
    samples,
    getSampleBytes: async sample => Uint8Array.from(
      sample.url === 'shared-snare.wav' ? [1, 2, 3] : [4, 5, 6],
    ).buffer,
  });
};

const createState = () => {
  const kitChannels = normalizeKitChannelsState([{
    id: 'local-kick',
    name: 'Local Kick',
    sample: 'local-kick.wav',
    percussionType: 'bass_drum',
    gain: 1,
  }], 'local-kit');
  const channel = kitChannels.entities['local-kick'];
  const sampleId = channel.velocityLayers[0].sampleId;
  return {
    song: {
      id: 'song-1',
      name: 'Song',
      selectedKitId: 'local-kit',
      selectedPatternId: 'pattern-0',
      patternIds: ['pattern-0'],
    },
    kits: {
      ids: ['local-kit'],
      entities: {
        'local-kit': { id: 'local-kit', name: 'Local Kit', channelIds: [channel.id] },
      },
    },
    kitChannels,
    samples: {
      ids: [sampleId],
      entities: {
        [sampleId]: {
          id: sampleId,
          name: 'Local Kick',
          url: 'local-kick.wav',
          sourceType: 'user',
        },
      },
    },
    patterns: {
      ids: ['pattern-0'],
      entities: {
        'pattern-0': {
          id: 'pattern-0',
          name: 'Pattern 1',
          timeSignature: { beatsPerBar: 4, beatUnit: 4 },
          bars: 1,
          stepsPerBeat: 4,
          laneIds: ['kick-lane'],
        },
      },
    },
    presets: { preset: 'Local Kit', userPresets: [] },
    userSamples: [],
  };
};

const runThunk = async (
  thunk: (dispatch: (action: unknown) => unknown, getState: () => ReturnType<typeof createState>) => unknown,
  state = createState(),
) => {
  const actions: DispatchedAction[] = [];
  const getState = () => state;
  const dispatch = (action: unknown): unknown => {
    if (typeof action === 'function') {
      return (action as (nestedDispatch: typeof dispatch, nestedGetState: typeof getState) => unknown)(
        dispatch,
        getState,
      );
    }
    actions.push(action as DispatchedAction);
    return action;
  };
  const result = await thunk(dispatch, getState);
  return { actions, result };
};

describe('kit bundle actions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('exports the selected kit as a downloadable bundle', async () => {
    (getSampleBytes as jest.MockedFunction<typeof getSampleBytes>)
      .mockResolvedValue(Uint8Array.from([5, 6, 7]).buffer);

    const { actions, result } = await runThunk(exportSelectedKit());

    expect(result).toBe(true);
    expect(downloadKitFile).toHaveBeenCalledWith(expect.any(String), 'test-kit.wds-kit');
    expect(actions.map(action => action.type)).toEqual(expect.arrayContaining([
      'kits/replaceKit',
      'window/showFlashMessage',
    ]));
  });

  test('imports a verified kit, persists samples, and selects a new user preset', async () => {
    const bundle = await createBundle();
    (readKitFile as jest.MockedFunction<typeof readKitFile>)
      .mockResolvedValue(serializeKitExportBundle(bundle));

    const { actions, result } = await runThunk(importKitFile({} as File));

    expect(result).toBe(true);
    expect(saveImportedSampleBytes).toHaveBeenCalledTimes(1);
    expect(actions.map(action => action.type)).toEqual(expect.arrayContaining([
      'userSamples/addUserSample',
      'presets/savePresetAs',
      'song/setSelectedKitId',
      'kits/replaceKit',
      'window/showFlashMessage',
    ]));
    const savedPreset = actions.find(action => action.type === 'presets/savePresetAs')?.payload as {
      kitId: string;
      channels: Array<{
        id: string;
        velocityLayers: Array<{ sample: string }>;
      }>;
    };
    expect(savedPreset.kitId).toMatch(/^kit-import-/);
    expect(savedPreset.channels[0].id).not.toBe('exported-kick');
    expect(savedPreset.channels[0].velocityLayers[0].sample).toMatch(/-import-/);
  });

  test('reuses a user preset with matching musical content', async () => {
    const bundle = await createBundle();
    (readKitFile as jest.MockedFunction<typeof readKitFile>)
      .mockResolvedValue(serializeKitExportBundle(bundle));
    const state = createState();
    (state.presets.userPresets as UserPreset[]).push({
      name: 'Already Here',
      kitId: 'existing-kit',
      channels: [{
        id: 'existing-kick',
        sample: 'existing-kick.wav',
        percussionType: 'bass_drum',
      }],
      contentHashAlgorithm: bundle.manifest.drumkit.kit.contentHashAlgorithm,
      contentHashVersion: bundle.manifest.drumkit.kit.contentHashVersion,
      contentHash: bundle.manifest.drumkit.kit.contentHash,
    });

    const { actions, result } = await runThunk(importKitFile({} as File), state);

    expect(result).toBe(true);
    expect(saveImportedSampleBytes).not.toHaveBeenCalled();
    expect(actions.find(action => action.type === 'presets/savePresetAs')).toBeUndefined();
    expect(actions.find(action => action.type === 'song/setSelectedKitId')?.payload)
      .toBe('existing-kit');
  });

  test('imports and rewrites every v2 layer to local sample references', async () => {
    const bundle = await createLayeredBundle();
    (readKitFile as jest.MockedFunction<typeof readKitFile>)
      .mockResolvedValue(serializeKitExportBundle(bundle));

    const { actions, result } = await runThunk(importKitFile({} as File));
    const savedPreset = actions.find(
      action => action.type === 'presets/savePresetAs',
    )?.payload as UserPreset;
    const layers = savedPreset.channels?.[0].velocityLayers || [];

    expect(result).toBe(true);
    expect(saveImportedSampleBytes).toHaveBeenCalledTimes(2);
    expect(layers).toHaveLength(3);
    expect(layers.map(layer => layer.maxVelocity)).toEqual([55, 100, 127]);
    expect(layers.map(layer => layer.alignmentOffset)).toEqual([0.01, 0.02, 0.03]);
    expect(layers.map(layer => layer.trimDb)).toEqual([-3, 0, -1]);
    expect(layers[0].sample).toBe(layers[2].sample);
    expect(layers[0].sampleId).toBe(layers[2].sampleId);
    expect(layers[0].sampleId).toMatch(/^sample:.*-import-/);
    expect(savedPreset.channels?.[0]).not.toHaveProperty('sample');
    expect(savedPreset.channels?.[0]).not.toHaveProperty('alignmentOffset');
  });

  test('rejects invalid files without changing kit or preset state', async () => {
    (readKitFile as jest.MockedFunction<typeof readKitFile>).mockResolvedValue('invalid');

    const { actions, result } = await runThunk(importKitFile({} as File));

    expect(result).toBe(false);
    expect(actions).toEqual([{
      type: 'window/showFlashMessage',
      payload: 'KIT_TRANSFER_ERROR',
    }]);
  });
});
