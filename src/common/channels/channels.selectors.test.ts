import { createDefaultSequencerState } from '../defaultSequencerState';
import { SAMPLE_LOAD_STATUSES } from '../sampleLoadStatus';
import { channelsSelector } from './channels.selectors';

describe('channelsSelector', () => {
  test('exposes the sample content hash as a waveform refresh revision', () => {
    const state = createDefaultSequencerState();
    const firstChannelId = state.kitChannels.ids[0];
    const sampleId = state.kitChannels.entities[firstChannelId].velocityLayers[0].sampleId;
    const sample = state.samples.entities[sampleId];
    state.samples.entities[sampleId] = {
      ...sample,
      contentHashAlgorithm: 'sha256',
      contentHashVersion: 1,
      contentHash: 'replacement-content-hash',
    };

    const [channel] = channelsSelector(state);

    expect(channel.sampleContentHash).toBe('replacement-content-hash');
  });

  test('derives legacy sample and alignment fields from the reference layer', () => {
    const state = {
      ...createDefaultSequencerState(),
      sampleLoadStatus: {} as Record<string, 'loading' | 'loaded' | 'error'>,
    };
    const firstChannelId = state.kitChannels.ids[0];
    const referenceLayer = state.kitChannels.entities[firstChannelId].velocityLayers[0];
    referenceLayer.alignmentOffset = 0.125;
    state.sampleLoadStatus[referenceLayer.sampleId] = SAMPLE_LOAD_STATUSES.LOADED;

    const [channel] = channelsSelector(state);

    expect(channel).toEqual(expect.objectContaining({
      kitChannelId: firstChannelId,
      sampleId: referenceLayer.sampleId,
      referenceVelocityLayerId: referenceLayer.id,
      alignmentOffset: 0.125,
      sampleLoaded: true,
    }));
  });

  test('resolves sample metadata and load status for every velocity layer', () => {
    const state = {
      ...createDefaultSequencerState(),
      sampleLoadStatus: {} as Record<string, 'loading' | 'loaded' | 'error'>,
    };
    const firstChannelId = state.kitChannels.ids[0];
    const channel = state.kitChannels.entities[firstChannelId];
    const referenceLayer = channel.velocityLayers[0];
    const softSampleId = 'sample:soft.wav';
    state.samples.ids.push(softSampleId);
    state.samples.entities[softSampleId] = {
      id: softSampleId,
      name: 'Soft',
      url: 'soft.wav',
      sourceType: 'user',
      contentHashAlgorithm: 'sha256',
      contentHashVersion: 1,
      contentHash: 'soft-hash',
    };
    state.sampleLoadStatus[softSampleId] = SAMPLE_LOAD_STATUSES.LOADED;
    channel.velocityLayers = [
      {
        ...referenceLayer,
        id: `${firstChannelId}:soft`,
        sampleId: softSampleId,
        maxVelocity: 63,
      },
      {
        ...referenceLayer,
        id: `${firstChannelId}:hard`,
      },
    ];

    const [resolvedChannel] = channelsSelector(state);

    expect(resolvedChannel.velocityLayers).toEqual([
      expect.objectContaining({
        id: `${firstChannelId}:soft`,
        sample: 'soft.wav',
        sampleContentHash: 'soft-hash',
        sampleLoaded: true,
      }),
      expect.objectContaining({
        id: `${firstChannelId}:hard`,
        sample: state.samples.entities[referenceLayer.sampleId].url,
      }),
    ]);
    expect(resolvedChannel.sampleId).toBe(referenceLayer.sampleId);
  });
});
