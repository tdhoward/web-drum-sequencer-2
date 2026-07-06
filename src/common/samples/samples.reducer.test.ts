import { sampleIdFromUrl } from '../sequencerModel';
import {
  addSampleFromUrl,
  removeSampleFromUrl,
  renameSampleFromUrl,
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
});
