import { sampleIdFromUrl } from '../sequencerModel';
import {
  addSampleFromUrl,
  removeSampleFromUrl,
  renameSampleFromUrl,
  setSampleAlignmentOffset,
  samplesReducer,
} from './samples.reducer';

describe('samples reducer', () => {
  test('renames a sample entity by URL', () => {
    const sampleUrl = 'user-kick.wav';
    const state = samplesReducer(undefined, addSampleFromUrl(sampleUrl, 'user'));
    const renamedState = samplesReducer(state, renameSampleFromUrl(sampleUrl, 'User Kick'));

    expect(renamedState.entities[sampleIdFromUrl(sampleUrl)].name).toEqual('User Kick');
  });

  test('removes a sample entity by URL', () => {
    const sampleUrl = 'user-kick.wav';
    const state = samplesReducer(undefined, addSampleFromUrl(sampleUrl, 'user'));
    const nextState = samplesReducer(state, removeSampleFromUrl(sampleUrl));

    expect(nextState.ids).not.toContain(sampleIdFromUrl(sampleUrl));
    expect(nextState.entities[sampleIdFromUrl(sampleUrl)]).toBeUndefined();
  });

  test('defaults alignment to zero and persists updates on the sample entity', () => {
    const sampleUrl = 'user-kick.wav';
    const sampleId = sampleIdFromUrl(sampleUrl);
    const state = samplesReducer(undefined, addSampleFromUrl(sampleUrl, 'user'));

    expect(state.entities[sampleId].alignmentOffset).toBe(0);

    const alignedState = samplesReducer(state, setSampleAlignmentOffset({
      sampleId,
      alignmentOffset: 0.126,
    }));
    const refreshedState = samplesReducer(alignedState, addSampleFromUrl(sampleUrl, 'user'));

    expect(refreshedState.entities[sampleId].alignmentOffset).toBe(0.126);
  });

  test('reset stores zero and invalid negative values cannot pass the sample beginning', () => {
    const sampleUrl = 'user-snare.wav';
    const sampleId = sampleIdFromUrl(sampleUrl);
    const state = samplesReducer(undefined, addSampleFromUrl(sampleUrl, 'user'));
    const alignedState = samplesReducer(state, setSampleAlignmentOffset({
      sampleId,
      alignmentOffset: 0.2,
    }));

    expect(samplesReducer(alignedState, setSampleAlignmentOffset({
      sampleId,
      alignmentOffset: 0,
    })).entities[sampleId].alignmentOffset).toBe(0);
    expect(samplesReducer(alignedState, setSampleAlignmentOffset({
      sampleId,
      alignmentOffset: -1,
    })).entities[sampleId].alignmentOffset).toBe(0);
  });
});
