import { loadPreset } from './presets.actions';
import { DEFAULT_KIT_ID, normalizeKitChannelsState } from '../sequencerModel';
import { PERCUSSION_TYPES } from '../percussion';

jest.mock('../../services/featureChecks');
jest.mock('../../services/sampleStore', () => ({
  loadSample: jest.fn(() => Promise.resolve(true)),
}));

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

describe('loadPreset', () => {
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
});
