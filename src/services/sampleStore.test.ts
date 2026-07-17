import { calculateSampleFingerprint } from '../common/contentHash';
import { saveToDB } from './database';
import { decodeAudio } from './fileUtils';
import { saveImportedSampleBytes } from './sampleStore';

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

describe('sample store imports', () => {
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
});
