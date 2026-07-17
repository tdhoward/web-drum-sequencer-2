import { doRenamePreset, loadPreset, requestPresetLoad } from './presets.actions';
import { DEFAULT_KIT_ID, normalizeKitChannelsState } from '../sequencerModel';
import type { PatternPack } from '../sequencerModel';
import { PERCUSSION_TYPES } from '../percussion';
import rootReducer from '../../reducer';
import { channelsSelector } from '../channels';
import { notesSelector } from '../notes';
import { loadPatternPack, savePatternPackAs } from '../patternPacks';

jest.mock('../../services/featureChecks');
jest.mock('../../services/sampleStore', () => ({
  loadSample: jest.fn(() => Promise.resolve(true)),
}));

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

describe('loadPreset', () => {
  test('defers an unresolved kit switch for mapping review without changing kit state', () => {
    const preset = {
      name: 'Kick Only Kit',
      channels: [{
        id: 'kick-channel',
        sample: 'kick.wav',
        percussionType: PERCUSSION_TYPES.BASS_DRUM,
      }],
    };
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedKitId: DEFAULT_KIT_ID,
        selectedPatternId: 'pattern-0',
        patternIds: ['pattern-0'],
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
            laneIds: ['unknown-lane'],
          },
        },
      },
    };
    const actions: DispatchedAction[] = [];

    const result = requestPresetLoad(preset)(
      action => actions.push(action as DispatchedAction),
      () => state,
    );

    expect(result.unresolved).toHaveLength(1);
    expect(actions.map(action => action.type)).toEqual(['mappingReview/openMappingReview']);
    expect(actions[0].payload).toEqual(expect.objectContaining({
      operation: expect.objectContaining({ type: 'kitPreset', preset }),
    }));
  });

  test('loads kit data and assignments without replacing pattern data', () => {
    const preset = {
      name: 'Djembe Kit',
      bpm: 140,
      swing: 0.3,
      channels: [
        {
          id: 'djembe-boom',
          name: 'Djembe Boom',
          sample: 'djembe-boom.wav',
          gain: 1,
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
          register: 'low',
        },
      ],
      notes: {
        ignored: [[]],
      },
    };
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedKitId: DEFAULT_KIT_ID,
        selectedPatternId: 'pattern-0',
        patternIds: ['pattern-0'],
      },
      patternPacks: {
        selectedPatternPackId: 'hip-hop-swing',
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
            name: 'Default Kit',
            channelIds: ['tr808-bd-short'],
          },
        },
      },
      kitChannels: normalizeKitChannelsState([
        {
          id: 'tr808-bd-short',
          sample: 'kick.mp3',
          gain: 1,
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
          register: 'low',
        },
      ]),
      patterns: {
        ids: ['pattern-0'],
        entities: {
          'pattern-0': {
            id: 'pattern-0',
            name: 'Pattern 1',
            timeSignature: {
              beatsPerBar: 4,
              beatUnit: 4,
            },
            bars: 1,
            stepsPerBeat: 4,
            laneIds: ['hiphop-bd-1'],
          },
        },
      },
      samples: {
        ids: [],
        entities: {},
      },
    };
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

    loadPreset(preset)(dispatch, getState);

    expect(actions.map(action => action.type)).toEqual([
      'song/setSelectedKitId',
      'samples/addSampleFromUrl',
      'kitChannels/sampleLoaded',
      'kitChannels/replaceKitChannels',
      'kits/setKitName',
      'presets/setPreset',
      'kitChannelAssignments/replaceKitChannelAssignments',
      'master/setSelectedChannel',
    ]);
    expect(actions[0].payload).toBe('kit-djembe-kit');
    expect(actions.find(action => action.type === 'notes/setNotes')).toBeUndefined();
    expect(actions.find(action => action.type === 'patterns/replacePatternLanes')).toBeUndefined();
    expect(actions.find(action => action.type === 'tempo/setBPM')).toBeUndefined();
    expect(actions.find(action => action.type === 'tempo/setSwing')).toBeUndefined();
    const assignmentAction = actions.find(
      action => action.type === 'kitChannelAssignments/replaceKitChannelAssignments',
    );
    const assignmentPayload = assignmentAction?.payload as { assignments: unknown[] };
    expect(assignmentPayload.assignments).toEqual([
      expect.objectContaining({
        id: 'djembe-boom',
        laneId: 'hiphop-bd-1',
        kitChannelId: 'djembe-boom',
        confidence: 'high',
      }),
    ]);
  });

  test('preserves imported pattern lanes and notes when switching kits', () => {
    const importedPatternPack: PatternPack = {
      id: 'user-imported-beats',
      name: 'Imported Beats',
      bpm: 105,
      swing: 0.1,
      lanes: [
        {
          id: 'portable-kick',
          laneId: 'portable-kick',
          name: 'Portable Kick',
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
        },
        {
          id: 'portable-snare',
          laneId: 'portable-snare',
          name: 'Portable Snare',
          percussionType: PERCUSSION_TYPES.SNARE_DRUM,
        },
      ],
      notes: {
        'portable-kick': [[{ beat: 1 }]],
        'portable-snare': [[{ beat: 2 }]],
      },
    };
    const secondKit = {
      name: 'Second Kit',
      channels: [
        {
          id: 'second-kit-kick',
          name: 'Second Kick',
          sample: 'second-kick.wav',
          percussionType: PERCUSSION_TYPES.BASS_DRUM,
        },
        {
          id: 'second-kit-snare',
          name: 'Second Snare',
          sample: 'second-snare.wav',
          percussionType: PERCUSSION_TYPES.SNARE_DRUM,
        },
      ],
    };
    let state = rootReducer(undefined, { type: '@@INIT' });
    const getState = () => state;
    const dispatch = (action: unknown): unknown => {
      if (typeof action === 'function') {
        return (action as (
          nestedDispatch: typeof dispatch,
          nestedGetState: typeof getState,
        ) => unknown)(dispatch, getState);
      }
      state = rootReducer(state, action as Parameters<typeof rootReducer>[1]);
      return action;
    };

    dispatch(savePatternPackAs(importedPatternPack));
    dispatch(loadPatternPack(importedPatternPack));
    expect(notesSelector(state)['portable-kick'][0]).toHaveLength(1);
    expect(notesSelector(state)['portable-snare'][0]).toHaveLength(1);

    dispatch(loadPreset(secondKit));

    expect(channelsSelector(state).map(channel => channel.id)).toEqual([
      'portable-kick',
      'portable-snare',
    ]);
    expect(notesSelector(state)['portable-kick'][0]).toHaveLength(1);
    expect(notesSelector(state)['portable-snare'][0]).toHaveLength(1);
  });
});

describe('doRenamePreset', () => {
  test('keeps the selected kit ID stable while renaming its preset and kit entity', () => {
    const actions: DispatchedAction[] = [];
    const state = {
      song: { selectedKitId: 'kit-original' },
      presets: {
        preset: 'Original',
        userPresets: [{ name: 'Original', channels: [] }],
      },
    };

    doRenamePreset('Original', 'Renamed')(
      action => actions.push(action as DispatchedAction),
      () => state as never,
    );

    expect(actions).toEqual([
      {
        type: 'presets/renamePreset',
        payload: { presetName: 'Original', name: 'Renamed', kitId: 'kit-original' },
      },
      {
        type: 'kits/setKitName',
        payload: { kitId: 'kit-original', name: 'Renamed' },
      },
    ]);
  });
});
