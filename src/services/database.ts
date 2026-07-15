import type { SampleFingerprint } from '../common/contentHash';

const DB_NAME = 'wds-1';
const DB_VERSION = 1;
const USER_SAMPLES = 'USER_SAMPLES';

export type StoredSampleRecord = {
  audioData: ArrayBuffer;
  fingerprint?: SampleFingerprint;
};

let db: IDBDatabase;

export const initializeDB = (): Promise<void> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onerror = (event) => {
    reject(event);
  };

  request.onupgradeneeded = () => {
    // Create an objectStore for this database
    db = request.result;
    db.createObjectStore(USER_SAMPLES);
  };

  request.onsuccess = () => {
    db = request.result;
    resolve(undefined);
  };
});

export const saveToDB = (
  myArrayBuffer: ArrayBuffer,
  myKey: string,
  fingerprint?: SampleFingerprint,
): Promise<string> => new Promise((resolve, reject) => {
  const trans = db.transaction([USER_SAMPLES], 'readwrite');
  const value: ArrayBuffer | StoredSampleRecord = fingerprint
    ? { audioData: myArrayBuffer, fingerprint }
    : myArrayBuffer;
  trans.objectStore(USER_SAMPLES).put(value, myKey);
  trans.onerror = (event) => {
    reject(event);
  };
  trans.oncomplete = () => {
    resolve(myKey);
  };
});

const isStoredSampleRecord = (value: unknown): value is StoredSampleRecord => Boolean(
  value
    && typeof value === 'object'
    && (value as StoredSampleRecord).audioData instanceof ArrayBuffer,
);

export const getSampleRecordFromDB = (
  myKey: string,
): Promise<StoredSampleRecord> => new Promise((resolve, reject) => {
  const trans = db.transaction([USER_SAMPLES], 'readwrite');
  const request = trans.objectStore(USER_SAMPLES).get(myKey);
  request.onerror = (event) => {
    reject(event);
  };
  request.onsuccess = () => {
    if (request.result instanceof ArrayBuffer) {
      resolve({ audioData: request.result });
      return;
    }
    if (isStoredSampleRecord(request.result)) {
      resolve(request.result);
      return;
    }
    reject(new Error(`Sample not found: ${myKey}`));
  };
});

export const getFromDB = (myKey: string): Promise<ArrayBuffer> => (
  getSampleRecordFromDB(myKey).then(record => record.audioData)
);

export const deleteFromDB = (myKey: string): Promise<string> => new Promise((resolve, reject) => {
  const trans = db.transaction([USER_SAMPLES], 'readwrite');
  trans.objectStore(USER_SAMPLES).delete(myKey);
  trans.onerror = (event) => {
    reject(event);
  };
  trans.oncomplete = () => {
    resolve(myKey);
  };
});
