import { downloadSongFile, readSongFile } from '../../services/songFiles';
import { getSampleBytes, saveImportedSampleBytes } from '../../services/sampleStore';
import { PERCUSSION_TYPES } from '../percussion';
import type { UserPreset } from '../presets';
import {
  DEFAULT_PATTERN_SETTINGS,
  normalizeKitChannelsState,
  normalizeNotesState,
} from '../sequencerModel';
import type { Kit, PatternPack, Sample, SavedSong } from '../sequencerModel';
import { createSongExportBundle, serializeSongExportBundle } from './songBundles';
import { exportCurrentSong, importSongFile } from './songBundles.actions';

jest.mock('../../services/featureChecks');
jest.mock('../../services/songFiles', () => ({
  downloadSongFile: jest.fn(),
  readSongFile: jest.fn(),
  songFileName: jest.fn(() => 'travel-song.wds-song'),
}));
jest.mock('../../services/sampleStore', () => ({
  getSampleBytes: jest.fn(),
  getSampleFingerprint: jest.fn(),
  loadSample: jest.fn(() => Promise.resolve(true)),
  saveImportedSampleBytes: jest.fn(() => Promise.resolve()),
}));

type DispatchedAction = { type?: string; payload?: unknown };

const localPack: PatternPack = {
  id: 'user-local-pack',
  name: 'Local Pack',
  bpm: 108,
  swing: 0.1,
  patternNames: ['Main'],
  patternSettings: [DEFAULT_PATTERN_SETTINGS],
  lanes: [{
    id: 'kick-lane',
    laneId: 'kick-lane',
    percussionType: PERCUSSION_TYPES.BASS_DRUM,
  }],
  notes: { 'kick-lane': [[{ beat: 1 }]] },
};

const createState = () => {
  const kitChannels = normalizeKitChannelsState([{
    id: 'local-kit-kick',
    laneId: 'kick-lane',
    name: 'Kick',
    sample: 'local-kick.wav',
    percussionType: PERCUSSION_TYPES.BASS_DRUM,
    gain: 1,
  }], 'local-kit');
  const channel = kitChannels.entities['local-kit-kick'];
  return {
    song: {
      id: 'song-1',
      name: 'Travel Song',
      selectedKitId: 'local-kit',
      selectedPatternId: 'pattern-0',
      patternIds: ['pattern-0'],
      patternPackId: localPack.id,
      arrangementPatternIds: [['pattern-0']],
      tempoChanges: [108],
    },
    songLibrary: { userSongs: [] as SavedSong[] },
    kits: {
      ids: ['local-kit'],
      entities: {
        'local-kit': { id: 'local-kit', name: 'Local Kit', channelIds: [channel.id] },
      },
    },
    kitChannels,
    kitChannelAssignments: {
      ids: [channel.id],
      entities: {
        [channel.id]: {
          id: channel.id,
          kitId: 'local-kit',
          laneId: 'kick-lane',
          kitChannelId: channel.id,
          confidence: 'manual',
        },
      },
    },
    samples: {
      ids: [channel.sampleId],
      entities: {
        [channel.sampleId]: {
          id: channel.sampleId,
          name: 'Kick',
          url: 'local-kick.wav',
          sourceType: 'user',
        },
      },
    },
    presets: {
      preset: 'Local Kit',
      userPresets: [] as UserPreset[],
    },
    userSamples: [],
    patternPacks: {
      selectedPatternPackId: localPack.id,
      userPatternPacks: [localPack],
    },
    tempo: { bpm: 112, swing: 0.2, humanize: 0 },
    patterns: {
      ids: ['pattern-0'],
      entities: {
        'pattern-0': {
          id: 'pattern-0',
          name: 'Edited Main',
          ...DEFAULT_PATTERN_SETTINGS,
          laneIds: ['kick-lane'],
        },
      },
    },
    notes: normalizeNotesState({
      'kick-lane': [[{ id: 'live-note-id', beat: 2, velocity: 0.75 }]],
    }, ['pattern-0']),
    playbackSession: {
      playing: false,
      startTime: null,
      mode: 'pattern',
      arrangementIndex: 0,
      activeBpm: null,
      activeTempoColumn: 0,
      songOccurrenceStartTime: null,
    },
    master: { pattern: 0, selectedChannel: 'kick-lane' },
  };
};

const createImportBundle = async () => {
  const channels = normalizeKitChannelsState([{
    id: 'source-kick',
    sample: 'source-kick.wav',
    percussionType: PERCUSSION_TYPES.BASS_DRUM,
    gain: 1,
  }], 'source-kit');
  const channel = channels.entities['source-kick'];
  const kit: Kit = { id: 'source-kit', name: 'Travel Kit', channelIds: [channel.id] };
  const sample: Sample = {
    id: channel.sampleId,
    name: 'Source Kick',
    url: 'source-kick.wav',
    sourceType: 'user',
  };
  const patternPack: PatternPack = {
    id: 'source-pack',
    name: 'Travel Pack',
    bpm: 96,
    swing: 0,
    lanes: [{
      id: 'source-kick',
      laneId: 'source-kick',
      percussionType: PERCUSSION_TYPES.BASS_DRUM,
    }],
    notes: { 'source-kick': [[{ beat: 1 }]] },
  };
  return createSongExportBundle({
    song: {
      id: 'source-song',
      name: 'Imported Travel Song',
      selectedKitId: kit.id,
      patternPackId: patternPack.id,
      arrangementPatternIds: [['pattern-0']],
      tempoChanges: [96],
    },
    kit,
    channels: [channel],
    samples: { [sample.id]: sample },
    patternPack,
    getSampleBytes: async () => Uint8Array.from([1, 3, 5, 7]).buffer,
  });
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

describe('song bundle actions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('exports the live Song, Kit, and edited Pattern pack', async () => {
    (getSampleBytes as jest.MockedFunction<typeof getSampleBytes>)
      .mockResolvedValue(Uint8Array.from([2, 4, 6]).buffer);

    const { actions, result } = await runThunk(exportCurrentSong());

    expect(result).toBe(true);
    expect(downloadSongFile).toHaveBeenCalledWith(expect.any(String), 'travel-song.wds-song');
    const serialized = (downloadSongFile as jest.Mock).mock.calls[0][0] as string;
    const exported = JSON.parse(serialized).manifest;
    expect(exported.song.arrangementPatternIds).toEqual([['pattern-0']]);
    expect(exported.drumkit.kit.name).toBe('Local Kit');
    expect(exported.patternPack).toEqual(expect.objectContaining({
      id: localPack.id,
      bpm: 112,
      swing: 0.2,
      patternNames: ['Edited Main'],
    }));
    expect(exported.patternPack.notes['kick-lane'][0][0].id).toBeUndefined();
    expect(actions[actions.length - 1]?.payload).toBe('SONG_EXPORTED');
  });

  test('imports all new dependencies, saves the Song, and selects it', async () => {
    const bundle = await createImportBundle();
    (readSongFile as jest.MockedFunction<typeof readSongFile>)
      .mockResolvedValue(serializeSongExportBundle(bundle));

    const { actions, result } = await runThunk(importSongFile({} as File));
    const actionTypes = actions.map(action => action.type);

    expect(result).toBe(true);
    expect(saveImportedSampleBytes).toHaveBeenCalledTimes(1);
    expect(actionTypes).toEqual(expect.arrayContaining([
      'userSamples/addUserSample',
      'presets/savePresetAs',
      'patternPacks/savePatternPackAs',
      'songLibrary/saveSongAs',
      'song/loadSong',
      'songLibrary/setSelectedSongId',
      'window/showFlashMessage',
    ]));
    const importedSong = actions.find(
      action => action.type === 'songLibrary/saveSongAs',
    )?.payload as SavedSong;
    expect(importedSong.selectedKitId).toMatch(/^kit-import-/);
    expect(importedSong.patternPackId).toBe('user-travel-pack');
    expect(importedSong.contentHash).toBe(bundle.manifest.song.contentHash);
    expect(actions).toContainEqual({
      type: 'window/showFlashMessage',
      payload: 'SONG_IMPORTED',
    });
  });

  test('reuses matching Kit, Pattern pack, and Song content', async () => {
    const bundle = await createImportBundle();
    (readSongFile as jest.MockedFunction<typeof readSongFile>)
      .mockResolvedValue(serializeSongExportBundle(bundle));
    const state = createState();
    state.presets.userPresets.push({
      name: 'Existing Travel Kit',
      kitId: 'existing-kit',
      channels: [{
        id: 'existing-kick',
        sample: 'existing-kick.wav',
        percussionType: PERCUSSION_TYPES.BASS_DRUM,
      }],
      contentHashAlgorithm: bundle.manifest.drumkit.kit.contentHashAlgorithm,
      contentHashVersion: bundle.manifest.drumkit.kit.contentHashVersion,
      contentHash: bundle.manifest.drumkit.kit.contentHash,
    });
    state.patternPacks.userPatternPacks.push({
      ...bundle.manifest.patternPack,
      id: 'existing-pack',
      name: 'Existing Travel Pack',
    });
    state.songLibrary.userSongs.push({
      ...bundle.manifest.song,
      id: 'existing-song',
      name: 'Existing Travel Song',
      selectedKitId: 'existing-kit',
      patternPackId: 'existing-pack',
    });

    const { actions, result } = await runThunk(importSongFile({} as File), state);

    expect(result).toBe(true);
    expect(saveImportedSampleBytes).not.toHaveBeenCalled();
    expect(actions.find(action => action.type === 'presets/savePresetAs')).toBeUndefined();
    expect(actions.find(action => action.type === 'patternPacks/savePatternPackAs')).toBeUndefined();
    expect(actions.find(action => action.type === 'songLibrary/saveSongAs')?.payload)
      .toEqual(expect.objectContaining({
        id: 'existing-song',
        selectedKitId: 'existing-kit',
        patternPackId: 'existing-pack',
      }));
  });

  test('rejects invalid files without changing content state', async () => {
    (readSongFile as jest.MockedFunction<typeof readSongFile>).mockResolvedValue('invalid');

    const { actions, result } = await runThunk(importSongFile({} as File));

    expect(result).toBe(false);
    expect(saveImportedSampleBytes).not.toHaveBeenCalled();
    expect(actions).toEqual([{
      type: 'window/showFlashMessage',
      payload: 'SONG_TRANSFER_ERROR',
    }]);
  });
});
