import { channelsInitialState, channelsReducer } from './channels.reducer';
import {
  setChannelSample,
  setChannelGain,
  setChannelName,
  setChannelPan,
  addChannel,
  removeChannel,
  replaceChannels,
  replaceKitChannels,
  setChannelPitchCoarse,
  setChannelPitchFine,
  setChannelReverb,
  setChannelMuted,
  setChannelSolo,
} from './channels.actions';

jest.mock('../../presets');
jest.mock('../../samples.config');
jest.mock('../../services/featureChecks');

const testSample = '/fake/sample/b/url.wav';
const firstChannelId = channelsInitialState.ids[0];
const getFirstChannel = state => state.entities[firstChannelId];

const expectFirstChannelField = (action, fieldName, expectedValue) => {
  const state = channelsReducer(channelsInitialState, action);
  expect(getFirstChannel(state)[fieldName]).toEqual(expectedValue);
};

describe('setChannelSample', () => {
  test('should change a sample', () => {
    expectFirstChannelField(
      setChannelSample(firstChannelId, testSample),
      'sampleId',
      `sample:${testSample}`,
    );
  });
});

describe('setChannelGain', () => {
  test('should change gain for a channel', () => {
    expectFirstChannelField(setChannelGain(firstChannelId, 0.5), 'gain', 0.5);
  });
});

describe('setChannelName', () => {
  test('should change name for a channel', () => {
    expectFirstChannelField(setChannelName(firstChannelId, 'Rim'), 'name', 'Rim');
  });
});

describe('setChannelPan', () => {
  test('should change pan for a channel', () => {
    expectFirstChannelField(setChannelPan(firstChannelId, 0.5), 'pan', 0.5);
  });
});

describe('setChannelPitchCoarse', () => {
  test('should change pitch (coarse) for a channel', () => {
    expectFirstChannelField(setChannelPitchCoarse(firstChannelId, 5), 'pitchCoarse', 5);
  });
});

describe('setChannelPitchFine', () => {
  test('should change pitch (fine) for a channel', () => {
    expectFirstChannelField(setChannelPitchFine(firstChannelId, -50), 'pitchFine', -50);
  });
});

describe('setChannelReverb', () => {
  test('should change reverb for a channel', () => {
    expectFirstChannelField(setChannelReverb(firstChannelId, 0.5), 'reverb', 0.5);
  });
});

describe('setChannelMuted', () => {
  test('should mute a channel', () => {
    expectFirstChannelField(setChannelMuted(firstChannelId, true), 'muted', true);
  });

  test('should set solo to false if it was true', () => {
    const soloState = channelsReducer(
      channelsInitialState,
      setChannelSolo(firstChannelId, true),
    );
    expect(getFirstChannel(soloState).solo).toEqual(true);
    const state = channelsReducer(
      soloState,
      setChannelMuted(firstChannelId, true),
    );
    expect(getFirstChannel(state).solo).toEqual(false);
  });
});

describe('setChannelSolo', () => {
  test('should solo a channel', () => {
    expectFirstChannelField(setChannelSolo(firstChannelId, true), 'solo', true);
  });

  test('should set muted to false if it was true', () => {
    const mutedState = channelsReducer(
      channelsInitialState,
      setChannelMuted(firstChannelId, true),
    );
    expect(getFirstChannel(mutedState).muted).toEqual(true);
    const state = channelsReducer(
      mutedState,
      setChannelSolo(firstChannelId, true),
    );
    expect(getFirstChannel(state).muted).toEqual(false);
  });
});

describe('addChannel', () => {
  test('should add a channel', () => {
    const state = channelsReducer(
      channelsInitialState,
      addChannel({
        id: '12345',
        gain: 1,
        sample: {},
      }),
    );
    expect(state.ids.length).toEqual(channelsInitialState.ids.length + 1);
    expect(state.entities['12345']).not.toBeUndefined();
  });
});

describe('removeChannel', () => {
  test('should remove a channel that exists', () => {
    const state = channelsReducer(
      channelsInitialState,
      removeChannel(firstChannelId),
    );
    expect(state.ids.length).toEqual(channelsInitialState.ids.length - 1);
    expect(state.entities[firstChannelId]).toBeUndefined();
  });

  test('should do nothing if no channel matches the ID', () => {
    const state = channelsReducer(
      channelsInitialState,
      removeChannel('foo'),
    );
    expect(state.ids.length).toEqual(channelsInitialState.ids.length);
  });
});

describe('replaceChannels', () => {
  test('should replace existing channels', () => {
    const state = channelsReducer(
      channelsInitialState,
      replaceChannels([
        {
          id: 'bass_drum',
          sample: 'test',
          gain: 1,
        },
      ]),
    );
    expect(state.ids.length).toEqual(1);
  });
});

describe('replaceKitChannels', () => {
  test('should replace existing kit channels without pattern notes payload', () => {
    const state = channelsReducer(
      channelsInitialState,
      replaceKitChannels([
        {
          id: 'bass_drum',
          sample: 'test',
          gain: 1,
        },
      ]),
    );
    expect(state.ids).toEqual(['bass_drum']);
  });
});
