import { fetchFile, decodeFile, decodeAudio } from './fileUtils';
import {
  saveToDB,
  getSampleRecordFromDB,
  deleteFromDB,
} from './database';
import { audioBufferToWavArrayBuffer, cloneAudioBuffer } from './sampleEditing';
import {
  calculateSampleFingerprint,
  type SampleFingerprint,
} from '../common/contentHash';

export const sampleStore: Record<string, AudioBuffer> = {};
export const sampleFingerprintStore: Record<string, SampleFingerprint> = {};

export type StoredSample = {
  id: string;
  fingerprint: SampleFingerprint;
};

let editedSampleCounter = 0;
let recordedSampleCounter = 0;

export const getSampleBuffer = (url: string): AudioBuffer | undefined => sampleStore[url];

export const getSampleFingerprint = (url: string): SampleFingerprint | undefined => (
  sampleFingerprintStore[url]
);

const fingerprintAndDecode = async (
  url: string,
  audioData: ArrayBuffer,
  fingerprint?: SampleFingerprint,
): Promise<AudioBuffer> => {
  const resolvedFingerprint = fingerprint || await calculateSampleFingerprint(audioData);
  // Web Audio implementations may detach the buffer passed to decodeAudioData.
  // Decode a copy so the verified payload remains intact for IndexedDB.
  const drumBuffer = await decodeAudio(audioData.slice(0));
  sampleFingerprintStore[url] = resolvedFingerprint;
  sampleStore[url] = drumBuffer;
  return drumBuffer;
};

export const loadSample = (url: string): Promise<boolean> => {
  if (typeof sampleStore[url] !== 'undefined') {
    return Promise.resolve(true);
  }

  return getSampleRecordFromDB(url)
    .then(async (record) => {
      await fingerprintAndDecode(url, record.audioData, record.fingerprint);
      if (!record.fingerprint) {
        await saveToDB(record.audioData, url, sampleFingerprintStore[url]);
      }
      return true;
    })
    .catch(() => fetchFile(url)
      .then(decodeFile)
      .then(audioData => fingerprintAndDecode(url, audioData))
      .then(() => {
        return true;
      })
      .catch(() => false));
};

export const loadSampleBuffer = (url: string): Promise<AudioBuffer | null> => loadSample(url)
  .then(success => (success ? getSampleBuffer(url) || null : null));

export const ensureSampleFingerprint = async (url: string): Promise<SampleFingerprint> => {
  const existing = getSampleFingerprint(url);
  if (existing) return existing;

  try {
    const record = await getSampleRecordFromDB(url);
    const fingerprint = record.fingerprint || await calculateSampleFingerprint(record.audioData);
    sampleFingerprintStore[url] = fingerprint;
    if (!record.fingerprint) {
      await saveToDB(record.audioData, url, fingerprint);
    }
    return fingerprint;
  } catch {
    const audioData = await fetchFile(url).then(decodeFile);
    const fingerprint = await calculateSampleFingerprint(audioData);
    sampleFingerprintStore[url] = fingerprint;
    return fingerprint;
  }
};

export const getSampleBytes = async (url: string): Promise<ArrayBuffer> => {
  try {
    const record = await getSampleRecordFromDB(url);
    return record.audioData;
  } catch {
    return fetchFile(url).then(decodeFile);
  }
};

export const saveImportedSampleBytes = async (
  id: string,
  audioData: ArrayBuffer,
  fingerprint: SampleFingerprint,
): Promise<StoredSample> => {
  const calculatedFingerprint = await calculateSampleFingerprint(audioData);
  if (
    calculatedFingerprint.contentHash !== fingerprint.contentHash
    || calculatedFingerprint.byteLength !== fingerprint.byteLength
  ) {
    throw new Error(`Imported sample fingerprint does not match payload: ${id}`);
  }
  const drumBuffer = await decodeAudio(audioData.slice(0));
  await saveToDB(audioData, id, calculatedFingerprint);
  sampleStore[id] = drumBuffer;
  sampleFingerprintStore[id] = calculatedFingerprint;
  return { id, fingerprint: calculatedFingerprint };
};

export const saveToSampleStore = (file: File): Promise<StoredSample> => {
  const id = file.name;
  return decodeFile(file)
    .then(async (myArrayBuffer) => {
      const fingerprint = await calculateSampleFingerprint(myArrayBuffer);
      const drumBuffer = await decodeAudio(myArrayBuffer.slice(0));
      await saveToDB(myArrayBuffer, id, fingerprint);
      sampleStore[id] = drumBuffer;
      sampleFingerprintStore[id] = fingerprint;
      return { id, fingerprint };
    });
};

const normalizeEditedSampleName = (sourceName = 'sample'): string => {
  const nameWithoutExtension = sourceName.replace(/\.[a-z0-9]+$/i, '');
  const safeName = nameWithoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safeName || 'sample';
};

const getEditedSampleId = (sourceName?: string): string => {
  const baseName = normalizeEditedSampleName(sourceName);
  editedSampleCounter += 1;
  return `${baseName}-edited-${Date.now()}-${editedSampleCounter}.wav`;
};

const getRecordedSampleId = (sourceName?: string): string => {
  const baseName = normalizeEditedSampleName(sourceName || 'recording');
  recordedSampleCounter += 1;
  return `${baseName}-recorded-${Date.now()}-${recordedSampleCounter}.wav`;
};

const saveAudioBufferAsWav = (
  id: string,
  audioBuffer: AudioBuffer,
): Promise<StoredSample> => {
  const wavSourceBuffer = cloneAudioBuffer(audioBuffer);
  const storedBuffer = cloneAudioBuffer(audioBuffer);
  const wavArrayBuffer = audioBufferToWavArrayBuffer(wavSourceBuffer);

  return calculateSampleFingerprint(wavArrayBuffer)
    .then(fingerprint => saveToDB(wavArrayBuffer, id, fingerprint)
      .then(() => fingerprint))
    .then((fingerprint) => {
      sampleFingerprintStore[id] = fingerprint;
      sampleStore[id] = storedBuffer;
      return { id, fingerprint };
    });
};

export const saveEditedSampleBuffer = (
  audioBuffer: AudioBuffer,
  sourceName?: string,
): Promise<StoredSample> => {
  const id = getEditedSampleId(sourceName);

  return saveAudioBufferAsWav(id, audioBuffer);
};

export const saveRecordedSampleBuffer = (
  audioBuffer: AudioBuffer,
  sourceName?: string,
): Promise<StoredSample> => saveAudioBufferAsWav(
  getRecordedSampleId(sourceName),
  audioBuffer,
);

export const deleteSampleBuffer = (sampleId: string): Promise<string> => (
  deleteFromDB(sampleId)
    .then((deletedSampleId) => {
      delete sampleStore[deletedSampleId];
      delete sampleFingerprintStore[deletedSampleId];
      return deletedSampleId;
    })
);
