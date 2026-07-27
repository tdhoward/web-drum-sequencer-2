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
});
