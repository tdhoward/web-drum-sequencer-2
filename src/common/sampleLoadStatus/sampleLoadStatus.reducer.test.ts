import {
  SAMPLE_LOAD_STATUSES,
  sampleLoadStatusReducer,
  setSampleLoadStatus,
} from './sampleLoadStatus.reducer';

describe('sample load status reducer', () => {
  test('tracks runtime loading state by sample rather than channel', () => {
    const loading = sampleLoadStatusReducer(undefined, setSampleLoadStatus({
      sampleId: 'sample:kick',
      status: SAMPLE_LOAD_STATUSES.LOADING,
    }));
    const loaded = sampleLoadStatusReducer(loading, setSampleLoadStatus({
      sampleId: 'sample:kick',
      status: SAMPLE_LOAD_STATUSES.LOADED,
    }));

    expect(loaded).toEqual({
      'sample:kick': SAMPLE_LOAD_STATUSES.LOADED,
    });
  });
});
