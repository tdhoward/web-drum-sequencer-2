import { DEFAULT_KIT_ID, normalizeKitChannelsState } from '../sequencerModel';
import { deleteChannel, getNextNewChannelName, newChannel } from './channels.actions';

jest.mock('../../presets');
jest.mock('../../samples.config');
jest.mock('../../services/uuid', () => ({
  uuid: jest.fn(() => 'new-channel-id'),
}));
jest.mock('../../services/sampleStore', () => ({
  loadSample: jest.fn(() => new Promise(() => {})),
}));

describe('getNextNewChannelName', () => {
  test('starts with New channel 1', () => {
    expect(getNextNewChannelName([])).toEqual('New channel 1');
  });

  test('uses the first available New channel number', () => {
    expect(getNextNewChannelName([
      { id: 'kick', name: 'Kick' },
      { id: 'new-1', name: 'New channel 1' },
      { id: 'new-3', name: 'New channel 3' },
    ])).toEqual('New channel 2');
  });
});

describe('newChannel', () => {
  test('names the added channel from the selected kit channel names', () => {
    const state = {
      song: {
        selectedKitId: DEFAULT_KIT_ID,
      },
      kits: {
        ids: [DEFAULT_KIT_ID],
        entities: {
          [DEFAULT_KIT_ID]: {
            id: DEFAULT_KIT_ID,
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
    const actions = [];

    newChannel()(action => actions.push(action), () => state);

    expect(actions.find(action => action.type === 'kitChannels/addChannel').payload)
      .toEqual(expect.objectContaining({
        id: 'new-channel-id',
        name: 'New channel 2',
        kitId: DEFAULT_KIT_ID,
        laneId: 'new-channel-id',
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
    const actions = [];

    deleteChannel('kit-kick', channels, 'lane-kick', 'lane-kick')(
      action => actions.push(action),
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
