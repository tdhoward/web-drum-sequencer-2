import {
  downloadPatternPackFile,
  readPatternPackFile,
} from '../../services/patternPackFiles';
import factoryPatternPacks from '../../patternPacks';
import { PERCUSSION_TYPES } from '../percussion';
import {
  DEFAULT_KIT_ID,
  DEFAULT_PATTERN_SETTINGS,
  normalizeKitChannelsState,
  normalizeNotesState,
} from '../sequencerModel';
import type { PatternPack, PatternsState } from '../sequencerModel';
import {
  createPatternPackExportBundle,
  serializePatternPackExportBundle,
} from './patternPackBundles';
import {
  exportSelectedPatternPack,
  importPatternPackFile,
} from './patternPackBundles.actions';

jest.mock('../../services/patternPackFiles', () => ({
  downloadPatternPackFile: jest.fn(),
  patternPackFileName: jest.fn(() => 'travel-beats.wds-pattern-pack'),
  readPatternPackFile: jest.fn(),
}));

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

const sourcePatternPack: PatternPack = {
  id: 'portable-travel-beats',
  name: 'Travel Beats',
  bpm: 104,
  swing: 0.15,
  patternNames: ['Main'],
  patternSettings: [DEFAULT_PATTERN_SETTINGS],
  lanes: [{
    id: 'travel-kick',
    laneId: 'travel-kick',
    name: 'Travel Kick',
    percussionType: PERCUSSION_TYPES.BASS_DRUM,
  }],
  notes: {
    'travel-kick': [[{ id: 'travel-note', beat: 1, velocity: 1.2 }]],
  },
};

const createState = (userPatternPacks: PatternPack[] = []) => {
  const patterns: PatternsState = {
    ids: ['pattern-0'],
    entities: {
      'pattern-0': {
        id: 'pattern-0',
        name: 'Edited Main',
        ...DEFAULT_PATTERN_SETTINGS,
        laneIds: ['kick'],
      },
    },
  };
  const selectedUserPack: PatternPack = {
    id: 'user-local-beats',
    name: 'Local Beats',
    bpm: 90,
    swing: 0,
    patternNames: ['Main'],
    lanes: [{
      id: 'kick',
      laneId: 'kick',
      name: 'Kick',
      percussionType: PERCUSSION_TYPES.BASS_DRUM,
    }],
    notes: { kick: [[]] },
  };
  const packs = userPatternPacks.length > 0 ? userPatternPacks : [selectedUserPack];
  return {
    song: {
      id: 'song-1',
      name: 'Song',
      selectedKitId: DEFAULT_KIT_ID,
      selectedPatternId: 'pattern-0',
      patternIds: ['pattern-0'],
    },
    patternPacks: {
      selectedPatternPackId: packs[0].id,
      userPatternPacks: packs,
    },
    tempo: { bpm: 112, swing: 0.3, humanize: 0 },
    patterns,
    notes: normalizeNotesState({
      kick: [[{ id: 'local-note', beat: 2, velocity: 0.8 }]],
    }, patterns.ids, patterns),
    kits: {
      ids: [DEFAULT_KIT_ID],
      entities: {
        [DEFAULT_KIT_ID]: {
          id: DEFAULT_KIT_ID,
          name: 'Default Kit',
          channelIds: ['kit-kick'],
        },
      },
    },
    kitChannels: normalizeKitChannelsState([{
      id: 'kit-kick',
      laneId: 'kick',
      name: 'Kick',
      sample: 'kick.wav',
      percussionType: PERCUSSION_TYPES.BASS_DRUM,
    }], DEFAULT_KIT_ID),
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
      return (action as (
        nestedDispatch: typeof dispatch,
        nestedGetState: typeof getState,
      ) => unknown)(dispatch, getState);
    }
    actions.push(action as DispatchedAction);
    return action;
  };
  const result = await thunk(dispatch, getState);
  return { actions, result };
};

describe('pattern pack bundle actions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('exports the live pattern state as a downloadable bundle', async () => {
    const { actions, result } = await runThunk(exportSelectedPatternPack());

    expect(result).toBe(true);
    expect(downloadPatternPackFile).toHaveBeenCalledWith(
      expect.any(String),
      'travel-beats.wds-pattern-pack',
    );
    const serialized = (downloadPatternPackFile as jest.Mock).mock.calls[0][0] as string;
    const exported = JSON.parse(serialized).manifest.patternPack as PatternPack;
    expect(exported).toEqual(expect.objectContaining({
      id: 'user-local-beats',
      name: 'Local Beats',
      bpm: 112,
      swing: 0.3,
      patternNames: ['Edited Main'],
    }));
    expect(exported.notes.kick[0][0]).toEqual(expect.objectContaining({ velocity: 0.8 }));
    expect(exported.notes.kick[0][0].id).toBeUndefined();
    expect(actions[actions.length - 1]?.payload).toBe('PATTERN_PACK_EXPORTED');
  });

  test('imports, saves, and selects a new verified pattern pack', async () => {
    const bundle = await createPatternPackExportBundle(sourcePatternPack);
    (readPatternPackFile as jest.MockedFunction<typeof readPatternPackFile>)
      .mockResolvedValue(serializePatternPackExportBundle(bundle));

    const { actions, result } = await runThunk(importPatternPackFile({} as File));

    expect(result).toBe(true);
    expect(actions.map(action => action.type)).toEqual(expect.arrayContaining([
      'patternPacks/savePatternPackAs',
      'playbackSession/stopPlayback',
      'patternPacks/setSelectedPatternPack',
      'window/showFlashMessage',
    ]));
    const imported = actions.find(
      action => action.type === 'patternPacks/savePatternPackAs',
    )?.payload as PatternPack;
    expect(imported.id).toBe('user-travel-beats');
    expect(imported.name).toBe('Travel Beats');
    expect(imported.contentHash).toBe(bundle.manifest.patternPack.contentHash);
    expect(imported.notes['travel-kick'][0][0].id).toBeUndefined();
  });

  test('loads matching user content instead of creating a duplicate', async () => {
    const bundle = await createPatternPackExportBundle(sourcePatternPack);
    (readPatternPackFile as jest.MockedFunction<typeof readPatternPackFile>)
      .mockResolvedValue(serializePatternPackExportBundle(bundle));
    const existing = {
      ...bundle.manifest.patternPack,
      id: 'user-already-here',
      name: 'Already Here',
    };

    const { actions, result } = await runThunk(
      importPatternPackFile({} as File),
      createState([existing]),
    );

    expect(result).toBe(true);
    expect(actions.find(action => action.type === 'patternPacks/savePatternPackAs')).toBeUndefined();
    expect(actions.find(action => action.type === 'patternPacks/setSelectedPatternPack')?.payload)
      .toBe('user-already-here');
  });

  test('loads matching factory content instead of creating a duplicate', async () => {
    const factoryPatternPack = factoryPatternPacks[1];
    const bundle = await createPatternPackExportBundle(factoryPatternPack);
    (readPatternPackFile as jest.MockedFunction<typeof readPatternPackFile>)
      .mockResolvedValue(serializePatternPackExportBundle(bundle));

    const { actions, result } = await runThunk(importPatternPackFile({} as File));

    expect(result).toBe(true);
    expect(actions.find(action => action.type === 'patternPacks/savePatternPackAs')).toBeUndefined();
    expect(actions.find(action => action.type === 'patternPacks/setSelectedPatternPack')?.payload)
      .toBe(factoryPatternPack.id);
  });

  test('assigns a collision-safe name and id to new content', async () => {
    const bundle = await createPatternPackExportBundle(sourcePatternPack);
    (readPatternPackFile as jest.MockedFunction<typeof readPatternPackFile>)
      .mockResolvedValue(serializePatternPackExportBundle(bundle));
    const sameNameDifferentContent: PatternPack = {
      ...sourcePatternPack,
      id: 'user-travel-beats',
      bpm: sourcePatternPack.bpm + 1,
    };

    const { actions, result } = await runThunk(
      importPatternPackFile({} as File),
      createState([sameNameDifferentContent]),
    );

    expect(result).toBe(true);
    const imported = actions.find(
      action => action.type === 'patternPacks/savePatternPackAs',
    )?.payload as PatternPack;
    expect(imported.name).toBe('Travel Beats (Imported)');
    expect(imported.id).toBe('user-travel-beats-imported');
  });

  test('rejects invalid files without changing pattern content state', async () => {
    (readPatternPackFile as jest.MockedFunction<typeof readPatternPackFile>)
      .mockResolvedValue('invalid');

    const { actions, result } = await runThunk(importPatternPackFile({} as File));

    expect(result).toBe(false);
    expect(actions).toEqual([{
      type: 'window/showFlashMessage',
      payload: 'PATTERN_PACK_TRANSFER_ERROR',
    }]);
  });
});
