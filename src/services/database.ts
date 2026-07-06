const DB_NAME = 'wds-1';
const DB_VERSION = 1;
const USER_SAMPLES = 'USER_SAMPLES';

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
): Promise<string> => new Promise((resolve, reject) => {
  const trans = db.transaction([USER_SAMPLES], 'readwrite');
  trans.objectStore(USER_SAMPLES).put(myArrayBuffer, myKey);
  trans.onerror = (event) => {
    reject(event);
  };
  trans.oncomplete = () => {
    resolve(myKey);
  };
});

export const getFromDB = (myKey: string): Promise<ArrayBuffer> => new Promise((resolve, reject) => {
  const trans = db.transaction([USER_SAMPLES], 'readwrite');
  const request = trans.objectStore(USER_SAMPLES).get(myKey);
  request.onerror = (event) => {
    reject(event);
  };
  request.onsuccess = () => {
    if (request.result) {
      resolve(request.result as ArrayBuffer);
    }
    reject();
  };
});
