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
      referenceVelocityLayer: expect.objectContaining({
        id: referenceLayer.id,
        sampleId: referenceLayer.sampleId,
      }),
      referenceVelocityLayerRange: {
        minVelocity: 1,
        maxVelocity: 127,
      },
      referenceSampleUrl: state.samples.entities[referenceLayer.sampleId].url,
      referenceAlignmentOffset: 0.125,
      velocityLayerCount: 1,
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
    state.sampleLoadStatus[referenceLayer.sampleId] = SAMPLE_LOAD_STATUSES.ERROR;
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
        sampleLoadStatus: SAMPLE_LOAD_STATUSES.LOADED,
        sampleLoaded: true,
      }),
      expect.objectContaining({
        id: `${firstChannelId}:hard`,
        sample: state.samples.entities[referenceLayer.sampleId].url,
        sampleLoadStatus: SAMPLE_LOAD_STATUSES.ERROR,
        sampleLoaded: false,
      }),
    ]);
    expect(resolvedChannel.sampleId).toBe(referenceLayer.sampleId);
  });

  test('exposes the velocity-64 layer range and waveform inputs for a layered channel', () => {
    const state = createDefaultSequencerState();
    const firstChannelId = state.kitChannels.ids[0];
    const channel = state.kitChannels.entities[firstChannelId];
    const originalLayer = channel.velocityLayers[0];
    const referenceSample = state.samples.entities[originalLayer.sampleId];
    channel.velocityLayers = [
      {
        ...originalLayer,
        id: `${firstChannelId}:soft`,
        sampleId: 'sample:soft',
        maxVelocity: 55,
      },
      {
        ...originalLayer,
        id: `${firstChannelId}:medium`,
        maxVelocity: 100,
        alignmentOffset: 0.04,
      },
      {
        ...originalLayer,
        id: `${firstChannelId}:hard`,
        sampleId: 'sample:hard',
      },
    ];

    const [resolvedChannel] = channelsSelector(state);

    expect(resolvedChannel).toEqual(expect.objectContaining({
      velocityLayerCount: 3,
      referenceVelocityLayerId: `${firstChannelId}:medium`,
      referenceVelocityLayerRange: {
        minVelocity: 56,
        maxVelocity: 100,
      },
      referenceSampleUrl: referenceSample.url,
      referenceSampleContentHash: referenceSample.contentHash,
      referenceAlignmentOffset: 0.04,
    }));
  });
});
