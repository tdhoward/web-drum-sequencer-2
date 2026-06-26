import { loadPreset } from './presets.actions';
import { DEFAULT_KIT_ID, normalizeKitChannelsState } from '../sequencerModel';
import { PERCUSSION_TYPES } from '../percussion';

jest.mock('../../services/featureChecks');
jest.mock('../../services/sampleStore', () => ({
  loadSample: jest.fn(() => Promise.resolve(true)),
}));

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
        selectedKitId: DEFAULT_KIT_ID,
        selectedPatternId: 'pattern-0',
      },
      patternPacks: {
        selectedPatternPackId: 'hip-hop-swing',
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
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
          laneIds: ['hiphop-bd-1'],
          },
        },
      },
      samples: {
        ids: [],
        entities: {},
      },
    };
    const actions = [];
    const getState = () => state;
    const dispatch = (action) => {
      if (typeof action === 'function') {
        return action(dispatch, getState);
      }
      actions.push(action);
      return action;
    };

    loadPreset(preset)(dispatch, getState);

    expect(actions.map(action => action.type)).toEqual([
      'samples/addSampleFromUrl',
      'kitChannels/sampleLoaded',
      'kitChannels/replaceKitChannels',
      'kits/setKitName',
      'presets/setPreset',
      'kitChannelAssignments/replaceKitChannelAssignments',
      'master/setSelectedChannel',
    ]);
    expect(actions.find(action => action.type === 'notes/setNotes')).toBeUndefined();
    expect(actions.find(action => action.type === 'patterns/replacePatternLanes')).toBeUndefined();
    expect(actions.find(action => action.type === 'tempo/setBPM')).toBeUndefined();
    expect(actions.find(action => action.type === 'tempo/setSwing')).toBeUndefined();
    const assignmentAction = actions.find(
      action => action.type === 'kitChannelAssignments/replaceKitChannelAssignments',
    );
    expect(assignmentAction.payload.assignments).toEqual([
      expect.objectContaining({
        id: 'djembe-boom',
        laneId: 'hiphop-bd-1',
        kitChannelId: 'djembe-boom',
        confidence: 'high',
      }),
    ]);
  });
});
