import { DEFAULT_KIT_ID, normalizeKitChannelsState } from '../sequencerModel';
import {
  deleteChannel,
  getNextNewChannelName,
  loadAndSetChannelSample,
  loadChannels,
  loadCurrentKitSamples,
  newChannel,
} from './channels.actions';
import { FLASH_MESSAGES } from '../window';

jest.mock('../../presets');
jest.mock('../../samples.config');
jest.mock('../../services/uuid', () => ({
  uuid: jest.fn(() => 'new-channel-id'),
}));
jest.mock('../../services/sampleStore', () => ({
  loadSample: jest.fn(() => new Promise(() => {})),
}));

type DispatchedAction = {
  type?: string;
  payload?: unknown;
};

describe('getNextNewChannelName', () => {
  test('starts with New channel 1', () => {
    expect(getNextNewChannelName([])).toEqual('New channel 1');
  });

  test('uses the first available New channel number', () => {
    expect(getNextNewChannelName([
      { name: 'Kick' },
      { name: 'New channel 1' },
      { name: 'New channel 3' },
    ])).toEqual('New channel 2');
  });
});

describe('newChannel', () => {
  test('names the added channel from the selected kit channel names', () => {
    const state = {
      song: {
        id: 'song-1',
        name: 'Test Song',
        selectedKitId: DEFAULT_KIT_ID,
        selectedPatternId: 'pattern-0',
        patternIds: ['pattern-0'],
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
            name: 'Default Kit',
            channelIds: ['kick', 'new-1', 'new-3'],
          },
        },
      },
      kitChannels: normalizeKitChannelsState([
        { id: 'kick', name: 'Kick', sample: 'kick.wav', gain: 1 },
        { id: 'new-1', name: 'New channel 1', sample: 'a.wav', gain: 1 },
        { id: 'new-3', name: 'New channel 3', sample: 'b.wav', gain: 1 },
      ]),
    };
    const actions: DispatchedAction[] = [];

    newChannel()(
      (action) => {
        actions.push(action as DispatchedAction);
        return action;
      },
      () => state,
    );

    const addChannelAction = actions.find(action => action.type === 'kitChannels/addChannel');
    expect(addChannelAction?.payload)
      .toEqual(expect.objectContaining({
        id: 'new-channel-id',
        name: 'New channel 2',
        kitId: DEFAULT_KIT_ID,
        laneId: 'new-channel-id',
      }));
  });
});

describe('loadChannels', () => {
  test('registers and loads every unique layer sample', () => {
    const actions: DispatchedAction[] = [];
    const state = {
      song: {
        selectedKitId: DEFAULT_KIT_ID,
      },
      samples: {
        ids: [],
        entities: {},
      },
    };

    loadChannels([{
      id: 'layered-snare',
      velocityLayers: [
        {
          id: 'soft',
          sample: 'soft.wav',
          maxVelocity: 63,
        },
        {
          id: 'hard',
          sample: 'hard.wav',
          maxVelocity: 127,
        },
      ],
    }])(
      (action) => {
        actions.push(action as DispatchedAction);
        return action;
      },
      () => state as never,
    );

    expect(actions.map(action => action.type)).toEqual([
      'samples/addSampleFromUrl',
      'sampleLoadStatus/setSampleLoadStatus',
      'samples/addSampleFromUrl',
      'sampleLoadStatus/setSampleLoadStatus',
      'kitChannels/replaceKitChannels',
    ]);
    expect(actions[0].payload).toEqual({
      sampleURL: 'soft.wav',
      sourceType: 'factory',
    });
    expect(actions[2].payload).toEqual({
      sampleURL: 'hard.wav',
      sourceType: 'factory',
    });
  });

  test('loads every unique sample in the current Kit, including non-reference layers', () => {
    const actions: DispatchedAction[] = [];
    const kitChannels = normalizeKitChannelsState([{
      id: 'layered-snare',
      velocityLayers: [
        {
          id: 'soft',
          sample: 'shared.wav',
          maxVelocity: 55,
        },
        {
          id: 'medium',
          sample: 'medium.wav',
          maxVelocity: 100,
        },
        {
          id: 'hard',
          sample: 'shared.wav',
          maxVelocity: 127,
        },
      ],
    }]);
    const state = {
      song: {
        selectedKitId: DEFAULT_KIT_ID,
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
            name: 'Layered Kit',
            channelIds: kitChannels.ids,
          },
        },
      },
      kitChannels,
      samples: {
        ids: ['sample:shared.wav', 'sample:medium.wav'],
        entities: {
          'sample:shared.wav': {
            id: 'sample:shared.wav',
            url: 'shared.wav',
            sourceType: 'user',
          },
          'sample:medium.wav': {
            id: 'sample:medium.wav',
            url: 'medium.wav',
            sourceType: 'user',
          },
        },
      },
      sampleLoadStatus: {},
    };

    loadCurrentKitSamples()(
      (action) => {
        actions.push(action as DispatchedAction);
        return action;
      },
      () => state as never,
    );

    expect(actions.filter(action => (
      action.type === 'sampleLoadStatus/setSampleLoadStatus'
    )).map(action => action.payload)).toEqual([
      {
        sampleId: 'sample:shared.wav',
        status: 'loading',
      },
      {
        sampleId: 'sample:medium.wav',
        status: 'loading',
      },
    ]);
  });
});

describe('loadAndSetChannelSample', () => {
  const createLayeredState = () => {
    const kitChannels = normalizeKitChannelsState([{
      id: 'snare',
      velocityLayers: [
        {
          id: 'snare:soft',
          sample: 'soft.wav',
          maxVelocity: 55,
        },
        {
          id: 'snare:medium',
          sample: 'medium.wav',
          maxVelocity: 100,
        },
        {
          id: 'snare:hard',
          sample: 'hard.wav',
          maxVelocity: 127,
        },
      ],
    }]);

    return {
      kitChannels,
    };
  };

  test('changes the current reference layer and announces the multi-layer scope', () => {
    const state = createLayeredState();
    const actions: DispatchedAction[] = [];

    loadAndSetChannelSample('snare', 'replacement.wav')(
      action => {
        actions.push(action as DispatchedAction);
        return action;
      },
      () => state as never,
    );

    expect(actions).toEqual([
      expect.any(Function),
      {
        type: 'kitChannels/setChannelSample',
        payload: {
          channel: 'snare',
          sampleURL: 'replacement.wav',
        },
      },
      {
        type: 'window/showFlashMessage',
        payload: FLASH_MESSAGES.VELOCITY_LAYER_SAMPLE_CHANGED,
      },
    ]);
  });

  test('does not show the scope notification for one layer or an unchanged sample', () => {
    const singleLayerState = {
      kitChannels: normalizeKitChannelsState([{
        id: 'kick',
        sample: 'kick.wav',
      }]),
    };
    const singleLayerActions: DispatchedAction[] = [];
    const unchangedActions: DispatchedAction[] = [];

    loadAndSetChannelSample('kick', 'replacement.wav')(
      action => {
        singleLayerActions.push(action as DispatchedAction);
        return action;
      },
      () => singleLayerState as never,
    );
    loadAndSetChannelSample('snare', 'medium.wav')(
      action => {
        unchangedActions.push(action as DispatchedAction);
        return action;
      },
      () => createLayeredState() as never,
    );

    expect(singleLayerActions).not.toContainEqual(expect.objectContaining({
      type: 'window/showFlashMessage',
    }));
    expect(unchangedActions).not.toContainEqual(expect.objectContaining({
      type: 'window/showFlashMessage',
    }));
  });
});

describe('deleteChannel', () => {
  test('removes the kit channel and clears notes for the assigned lane', () => {
    const channels = [
      {
        id: 'lane-kick',
        kitChannelId: 'kit-kick',
      },
      {
        id: 'lane-snare',
        kitChannelId: 'kit-snare',
      },
    ];
    const actions: DispatchedAction[] = [];

    deleteChannel('kit-kick', channels, 'lane-kick', 'lane-kick')(
      (action) => {
        actions.push(action as DispatchedAction);
        return action;
      },
    );

    expect(actions.map(action => action.type)).toEqual([
      'master/setSelectedChannel',
      'notes/removeChannelNotes',
      'kitChannels/removeChannel',
    ]);
    expect(actions[0].payload).toEqual('lane-snare');
    expect(actions[1].payload).toEqual('lane-kick');
    expect(actions[2].payload).toEqual('kit-kick');
  });
});
