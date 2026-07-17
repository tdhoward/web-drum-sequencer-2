import {
  replaceUserSampleBuffer,
  saveEditedSampleBuffer,
} from '../../services/sampleStore';
import factorySamples from '../../samples.config';
import { saveEditedUserSample } from './userSamples.actions';

jest.mock('../../services/sampleStore', () => ({
  deleteSampleBuffer: jest.fn(),
  replaceUserSampleBuffer: jest.fn(),
  saveEditedSampleBuffer: jest.fn(),
  saveRecordedSampleBuffer: jest.fn(),
  saveToSampleStore: jest.fn(),
}));

const fingerprint = {
  contentHashAlgorithm: 'sha256' as const,
  contentHashVersion: 1 as const,
  contentHash: 'edited-content-hash',
  byteLength: 128,
};

const mockedReplaceUserSampleBuffer = (
  replaceUserSampleBuffer as jest.MockedFunction<typeof replaceUserSampleBuffer>
);
const mockedSaveEditedSampleBuffer = (
  saveEditedSampleBuffer as jest.MockedFunction<typeof saveEditedSampleBuffer>
);

describe('saveEditedUserSample', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReplaceUserSampleBuffer.mockResolvedValue({
      id: 'user-kick.wav',
      fingerprint,
    });
    mockedSaveEditedSampleBuffer.mockResolvedValue({
      id: 'kick-copy.wav',
      fingerprint,
    });
  });

  test('replaces only a sample registered as a user sample', async () => {
    const dispatch = jest.fn();
    const editedBuffer = {} as AudioBuffer;
    const thunk = saveEditedUserSample(
      'channel-1',
      editedBuffer,
      'Kick',
      'My Kick',
      'user-kick.wav',
    );

    await thunk(dispatch, () => ({
      userSamples: [{
        id: 'user-kick.wav',
        name: 'Old Kick',
        createdAt: 123,
        sourceType: 'uploaded',
      }],
    }));

    expect(mockedReplaceUserSampleBuffer).toHaveBeenCalledWith(
      editedBuffer,
      'user-kick.wav',
    );
    expect(mockedSaveEditedSampleBuffer).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'userSamples/addUserSample',
      payload: expect.objectContaining({
        id: 'user-kick.wav',
        name: 'My Kick',
        createdAt: 123,
        sourceType: 'edited',
      }),
    }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'samples/renameSampleFromUrl',
      payload: {
        sampleURL: 'user-kick.wav',
        name: 'My Kick',
      },
    }));
    expect(dispatch.mock.calls.some(([action]) => typeof action === 'function')).toBe(false);
  });

  test('falls back to save-copy when the requested id is not a user sample', async () => {
    const dispatch = jest.fn();
    const editedBuffer = {} as AudioBuffer;
    const thunk = saveEditedUserSample(
      'channel-1',
      editedBuffer,
      'Factory Kick',
      'Factory Kick Edit',
      factorySamples[0].url,
    );

    await thunk(dispatch, () => ({
      userSamples: [{ id: factorySamples[0].url, name: 'Colliding User Metadata' }],
    }));

    expect(mockedReplaceUserSampleBuffer).not.toHaveBeenCalled();
    expect(mockedSaveEditedSampleBuffer).toHaveBeenCalledWith(
      editedBuffer,
      'Factory Kick Edit',
    );
    expect(dispatch.mock.calls.some(([action]) => typeof action === 'function')).toBe(true);
  });
});
