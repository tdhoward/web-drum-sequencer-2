import { channelsInitialState, channelsReducer } from './channels.reducer';
import {
  setChannelSample,
  setChannelGain,
  setChannelName,
  setChannelPercussionType,
  setChannelPan,
  addChannel,
  removeChannel,
  replaceChannels,
  replaceKitChannels,
  replaceChannelVelocityLayers,
  setChannelPitchCoarse,
  setChannelPitchFine,
  setChannelReverb,
  setChannelMuted,
  setChannelSolo,
  setVelocityLayerAlignment,
  setVelocityLayerSample,
  transformChannelSampleAlignments,
} from './channels.actions';
import { PERCUSSION_TYPES } from '../percussion';
import type { KitChannelsState } from '../sequencerModel';

jest.mock('../../presets');
jest.mock('../../samples.config');
jest.mock('../../services/featureChecks');

const testSample = '/fake/sample/b/url.wav';
const firstChannelId = channelsInitialState.ids[0];
const getFirstChannel = (state: KitChannelsState) => state.entities[firstChannelId];

type ChannelsAction = Parameters<typeof channelsReducer>[1];

const expectFirstChannelField = (
  action: ChannelsAction,
  fieldName: string,
  expectedValue: unknown,
): void => {
  const state = channelsReducer(channelsInitialState, action);
  expect(getFirstChannel(state)[fieldName]).toEqual(expectedValue);
};

describe('setChannelSample', () => {
  test('changes only the reference layer sample', () => {
    const state = channelsReducer(
      channelsInitialState,
      setChannelSample(firstChannelId, testSample),
    );

    expect(getFirstChannel(state).velocityLayers[0].sampleId)
      .toBe(`sample:${testSample}`);
    expect(getFirstChannel(state)).not.toHaveProperty('sampleId');
  });

  test('delegates a compatibility update only to the velocity-64 layer', () => {
    const original = getFirstChannel(channelsInitialState).velocityLayers[0];
    const layered = channelsReducer(
      channelsInitialState,
      replaceChannelVelocityLayers({
        channelId: firstChannelId,
        velocityLayers: [
          { ...original, id: 'soft', sampleId: 'sample:soft', maxVelocity: 63 },
          { ...original, id: 'hard', sampleId: 'sample:hard', maxVelocity: 127 },
        ],
      }),
    );
    const updated = channelsReducer(
      layered,
      setChannelSample(firstChannelId, testSample),
    );

    expect(getFirstChannel(updated).velocityLayers.map(layer => layer.sampleId)).toEqual([
      'sample:soft',
      `sample:${testSample}`,
    ]);
  });
});

describe('velocity layer updates', () => {
  test('targets sample and alignment updates by stable layer ID', () => {
    const layerId = getFirstChannel(channelsInitialState).velocityLayers[0].id;
    const sampled = channelsReducer(
      channelsInitialState,
      setVelocityLayerSample(firstChannelId, layerId, 'sample:replacement'),
    );
    const aligned = channelsReducer(
      sampled,
      setVelocityLayerAlignment(firstChannelId, layerId, 0.126),
    );

    expect(getFirstChannel(aligned).velocityLayers[0]).toEqual(expect.objectContaining({
      sampleId: 'sample:replacement',
      alignmentOffset: 0.126,
    }));
  });

  test('transforms every active layer that references a replaced sample', () => {
    const original = getFirstChannel(channelsInitialState).velocityLayers[0];
    const layered = channelsReducer(
      channelsInitialState,
      replaceChannelVelocityLayers({
        channelId: firstChannelId,
        velocityLayers: [
          {
            ...original,
            id: 'soft',
            alignmentOffset: 0.1,
            maxVelocity: 63,
          },
          {
            ...original,
            id: 'hard',
            alignmentOffset: 0.6,
            maxVelocity: 127,
          },
        ],
      }),
    );
    const transformed = channelsReducer(
      layered,
      transformChannelSampleAlignments({
        sampleId: original.sampleId,
        trimStartSeconds: 0.25,
        renderedDuration: 0.3,
      }),
    );

    expect(getFirstChannel(transformed).velocityLayers.map(layer => layer.alignmentOffset))
      .toEqual([0, 0.3]);
  });

  test('replaces a complete valid partition atomically and rejects invalid partitions', () => {
    const original = getFirstChannel(channelsInitialState);
    const replacement = [
      { ...original.velocityLayers[0], id: 'soft', maxVelocity: 63 },
      { ...original.velocityLayers[0], id: 'hard', maxVelocity: 127 },
    ];
    const replaced = channelsReducer(
      channelsInitialState,
      replaceChannelVelocityLayers({
        channelId: firstChannelId,
        velocityLayers: replacement,
      }),
    );
    const rejected = channelsReducer(
      replaced,
      replaceChannelVelocityLayers({
        channelId: firstChannelId,
        velocityLayers: [{ ...replacement[0], maxVelocity: 100 }],
      }),
    );

    expect(getFirstChannel(replaced).velocityLayers).toEqual(replacement);
    expect(getFirstChannel(rejected).velocityLayers).toEqual(replacement);
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

describe('setChannelPercussionType', () => {
  test('should change percussion type for a channel', () => {
    expectFirstChannelField(
      setChannelPercussionType(firstChannelId, PERCUSSION_TYPES.RIMSHOT),
      'percussionType',
      PERCUSSION_TYPES.RIMSHOT,
    );
  });

  test('should ignore invalid percussion types', () => {
    const state = channelsReducer(
      channelsInitialState,
      setChannelPercussionType(firstChannelId, 'laser_whistle'),
    );

    expect(getFirstChannel(state).percussionType)
      .toBe(getFirstChannel(channelsInitialState).percussionType);
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
        sample: 'test.wav',
      }),
    );
    expect(state.ids.length).toEqual(channelsInitialState.ids.length + 1);
    expect(state.entities['12345'].velocityLayers).toEqual([
      expect.objectContaining({
        id: '12345:layer:1',
        sampleId: 'sample:test.wav',
        maxVelocity: 127,
      }),
    ]);
    expect(state.entities['12345']).not.toHaveProperty('sampleId');
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
