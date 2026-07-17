import { createDefaultSequencerState } from '../defaultSequencerState';
import { channelsSelector } from './channels.selectors';

describe('channelsSelector', () => {
  test('exposes the sample content hash as a waveform refresh revision', () => {
    const state = createDefaultSequencerState();
    const firstChannelId = state.kitChannels.ids[0];
    const sampleId = state.kitChannels.entities[firstChannelId].sampleId;
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
});
