import {
  replaceUserSampleBuffer,
  saveEditedSampleBuffer,
  saveRecordedSampleBuffer,
  saveToSampleStore,
} from '../../services/sampleStore';
import factorySamples from '../../samples.config';
import {
  saveEditedUserSample,
  saveRecordedUserSample,
  saveUserSample,
} from './userSamples.actions';

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
const mockedSaveRecordedSampleBuffer = (
  saveRecordedSampleBuffer as jest.MockedFunction<typeof saveRecordedSampleBuffer>
);
const mockedSaveToSampleStore = (
  saveToSampleStore as jest.MockedFunction<typeof saveToSampleStore>
);

describe('new user samples', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('resets channel pitch after importing a sample', async () => {
    const dispatch = jest.fn();
    const file = new File(['sample'], 'imported.wav', { type: 'audio/wav' });
    const savedSample = Promise.resolve({ id: 'imported.wav', fingerprint });
    mockedSaveToSampleStore.mockReturnValue(savedSample);

    saveUserSample('channel-1', [file])(dispatch);
    await savedSample;

    expect(dispatch).toHaveBeenCalledWith({
      type: 'kitChannels/setChannelPitchCoarse',
      payload: { channel: 'channel-1', pitchCoarse: 0 },
    });
  });

  test('resets channel pitch after recording a sample', async () => {
    const dispatch = jest.fn();
    const audioBuffer = {} as AudioBuffer;
    mockedSaveRecordedSampleBuffer.mockResolvedValue({
      id: 'recorded.wav',
      fingerprint,
    });

    await saveRecordedUserSample('channel-1', audioBuffer, 'Recording')(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'kitChannels/setChannelPitchCoarse',
      payload: { channel: 'channel-1', pitchCoarse: 0 },
    });
  });
});

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

  test('can create an edited asset without assigning it before the editor applies its draft', async () => {
    const dispatch = jest.fn(action => action);
    const editedBuffer = {} as AudioBuffer;
    const thunk = saveEditedUserSample(
      'channel-1',
      editedBuffer,
      'Factory Kick',
      'Layer Copy',
      undefined,
      false,
    );

    const sampleUrl = await thunk(dispatch, () => ({ userSamples: [] }));
    const dispatchedThunks = dispatch.mock.calls
      .map(([action]) => action)
      .filter(action => typeof action === 'function');

    expect(sampleUrl).toBe('kick-copy.wav');
    expect(dispatchedThunks).toHaveLength(1);
    expect(dispatch.mock.calls.some(([action]) => (
      action?.type === 'kitChannels/setChannelSample'
    ))).toBe(false);
  });
});
