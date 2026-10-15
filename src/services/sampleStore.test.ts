import { calculateSampleFingerprint } from '../common/contentHash';
import { getSampleRecordFromDB, saveToDB } from './database';
import { decodeAudio } from './fileUtils';
import {
  getSampleBuffer,
  loadSample,
  replaceUserSampleBuffer,
  saveImportedSampleBytes,
} from './sampleStore';

jest.mock('./database', () => ({
  deleteFromDB: jest.fn(),
  getSampleRecordFromDB: jest.fn(),
  saveToDB: jest.fn(() => Promise.resolve('imported.wav')),
}));

jest.mock('./fileUtils', () => ({
  decodeAudio: jest.fn(() => Promise.resolve({} as AudioBuffer)),
  decodeFile: jest.fn(),
  fetchFile: jest.fn(),
}));

jest.mock('./sampleEditing', () => ({
  audioBufferToWavArrayBuffer: jest.fn(() => Uint8Array.from([1, 2, 3, 4]).buffer),
  cloneAudioBuffer: jest.fn((audioBuffer: AudioBuffer) => audioBuffer),
}));

describe('sample store imports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shares one decode for concurrent loads of the same sample', async () => {
    const audioData = Uint8Array.from([5, 10, 15, 20]).buffer;
    const fingerprint = await calculateSampleFingerprint(audioData);
    let resolveRecord: ((record: {
      audioData: ArrayBuffer;
      fingerprint: typeof fingerprint;
    }) => void) | undefined;
    const recordPromise = new Promise<{
      audioData: ArrayBuffer;
      fingerprint: typeof fingerprint;
    }>((resolve) => {
      resolveRecord = resolve;
    });
    (getSampleRecordFromDB as jest.MockedFunction<typeof getSampleRecordFromDB>)
      .mockReturnValue(recordPromise);

    const firstLoad = loadSample('concurrent-layer-sample.wav');
    const secondLoad = loadSample('concurrent-layer-sample.wav');

    expect(firstLoad).toBe(secondLoad);
    expect(getSampleRecordFromDB).toHaveBeenCalledTimes(1);

    resolveRecord?.({ audioData, fingerprint });
    await expect(firstLoad).resolves.toBe(true);
    await expect(secondLoad).resolves.toBe(true);
    expect(decodeAudio).toHaveBeenCalledTimes(1);
  });

  test('decodes a copy and preserves verified bytes for IndexedDB', async () => {
    const audioData = Uint8Array.from([10, 20, 30, 40]).buffer;
    const fingerprint = await calculateSampleFingerprint(audioData);

    await saveImportedSampleBytes('imported.wav', audioData, fingerprint);

    const decodedBytes = (decodeAudio as jest.MockedFunction<typeof decodeAudio>).mock.calls[0][0];
    expect(decodedBytes).not.toBe(audioData);
    expect(new Uint8Array(decodedBytes)).toEqual(new Uint8Array(audioData));
    expect(saveToDB).toHaveBeenCalledWith(audioData, 'imported.wav', fingerprint);
    expect(audioData.byteLength).toBe(4);
  });

  test('replaces a user sample under its existing storage id', async () => {
    const editedBuffer = {} as AudioBuffer;

    const storedSample = await replaceUserSampleBuffer(editedBuffer, 'user-kick.wav');

    expect(saveToDB).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      'user-kick.wav',
      storedSample.fingerprint,
    );
    expect(storedSample.id).toBe('user-kick.wav');
    expect(getSampleBuffer('user-kick.wav')).toBe(editedBuffer);
  });
});
