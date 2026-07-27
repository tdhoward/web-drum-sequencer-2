import {
  deleteSampleBuffer,
  replaceUserSampleBuffer,
  saveEditedSampleBuffer,
  saveRecordedSampleBuffer,
  saveToSampleStore,
} from '../../services/sampleStore';
import factorySamples from '../../samples.config';
import {
  createRecordedUserSample,
  createUploadedUserSample,
  deleteSavedUserSample,
  saveEditedUserSample,
  saveRecordedUserSample,
  saveUserSample,
} from './userSamples.actions';
import { normalizeKitChannelsState } from '../sequencerModel';
import { FLASH_MESSAGES } from '../window';

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
const mockedDeleteSampleBuffer = (
  deleteSampleBuffer as jest.MockedFunction<typeof deleteSampleBuffer>
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

  test('can create uploaded and recorded assets without assigning a channel', async () => {
    const dispatch = jest.fn(action => action);
    const file = new File(['sample'], 'draft-upload.wav', { type: 'audio/wav' });
    mockedSaveToSampleStore.mockResolvedValue({
      id: 'draft-upload.wav',
      fingerprint,
    });
    mockedSaveRecordedSampleBuffer.mockResolvedValue({
      id: 'draft-recording.wav',
      fingerprint,
    });

    await createUploadedUserSample(file)(dispatch);
    await createRecordedUserSample({} as AudioBuffer, 'Draft Recording')(dispatch);

    expect(dispatch.mock.calls.some(([action]) => (
      action?.type === 'kitChannels/setChannelSample'
    ))).toBe(false);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'userSamples/addUserSample',
      payload: expect.objectContaining({ id: 'draft-upload.wav' }),
    }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'userSamples/addUserSample',
      payload: expect.objectContaining({ id: 'draft-recording.wav' }),
    }));
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
      false,
      {
        trimStartSeconds: 0.25,
        renderedDuration: 0.5,
      },
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
    expect(dispatch).toHaveBeenCalledWith({
      type: 'sampleLoadStatus/setSampleLoadStatus',
      payload: {
        sampleId: 'sample:user-kick.wav',
        status: 'loaded',
      },
    });
    expect(dispatch.mock.calls.some(([action]) => typeof action === 'function')).toBe(false);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'kitChannels/transformChannelSampleAlignments',
      payload: {
        sampleId: 'sample:user-kick.wav',
        trimStartSeconds: 0.25,
        renderedDuration: 0.5,
      },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'presets/transformPresetSampleAlignments',
      payload: {
        sampleId: 'sample:user-kick.wav',
        trimStartSeconds: 0.25,
        renderedDuration: 0.5,
      },
    });
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

  test('does not transform layer state when replacement persistence fails', async () => {
    const dispatch = jest.fn(action => action);
    mockedReplaceUserSampleBuffer.mockRejectedValueOnce(new Error('save failed'));
    const thunk = saveEditedUserSample(
      'channel-1',
      {} as AudioBuffer,
      'Kick',
      'My Kick',
      'user-kick.wav',
      false,
      {
        trimStartSeconds: 0.25,
        renderedDuration: 0.5,
      },
    );

    await expect(thunk(dispatch, () => ({
      userSamples: [{ id: 'user-kick.wav', name: 'Kick' }],
    }))).rejects.toThrow('save failed');

    expect(dispatch.mock.calls.some(([action]) => (
      action?.type === 'kitChannels/transformChannelSampleAlignments'
      || action?.type === 'presets/transformPresetSampleAlignments'
    ))).toBe(false);
  });
});

describe('deleteSavedUserSample', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not delete a sample used only by a non-reference velocity layer', async () => {
    const dispatch = jest.fn();
    const kitChannels = normalizeKitChannelsState([{
      id: 'snare',
      velocityLayers: [
        {
          id: 'snare:main',
          sample: 'main.wav',
          maxVelocity: 100,
        },
        {
          id: 'snare:hard',
          sample: 'protected.wav',
          maxVelocity: 127,
        },
      ],
    }]);

    const deleted = await deleteSavedUserSample('protected.wav')(
      dispatch,
      () => ({ kitChannels }),
    );

    expect(deleted).toBe(false);
    expect(mockedDeleteSampleBuffer).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'window/showFlashMessage',
      payload: FLASH_MESSAGES.SAMPLE_DELETE_IN_USE,
    });
  });

  test('deletes a sample with no active layer references', async () => {
    const dispatch = jest.fn();
    mockedDeleteSampleBuffer.mockResolvedValue('unused.wav');

    const deleted = await deleteSavedUserSample('unused.wav')(
      dispatch,
      () => ({
        kitChannels: normalizeKitChannelsState([{
          id: 'kick',
          sample: 'kick.wav',
        }]),
      }),
    );

    expect(deleted).toBe(true);
    expect(mockedDeleteSampleBuffer).toHaveBeenCalledWith('unused.wav');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'userSamples/removeUserSample',
      payload: 'unused.wav',
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'samples/removeSampleFromUrl',
      payload: {
        sampleURL: 'unused.wav',
      },
    });
  });
});
