import { fetchFile, decodeFile, decodeAudio } from './fileUtils';
import { saveToDB, getFromDB } from './database';
import { audioBufferToWavArrayBuffer, cloneAudioBuffer } from './sampleEditing';

export const sampleStore: Record<string, AudioBuffer> = {};

let editedSampleCounter = 0;

export const getSampleBuffer = (url: string): AudioBuffer | undefined => sampleStore[url];

export const loadSample = (url: string): Promise<boolean> => {
  if (typeof sampleStore[url] !== 'undefined') {
    return Promise.resolve(true);
  }

  return getFromDB(url)
    .then(decodeAudio)
    .then((drumBuffer) => {
      sampleStore[url] = drumBuffer;
      return true;
    })
    .catch(() => fetchFile(url)
      .then(decodeFile)
      .then(decodeAudio)
      .then((drumBuffer) => {
        sampleStore[url] = drumBuffer;
        return true;
      })
      .catch(() => false));
};

export const loadSampleBuffer = (url: string): Promise<AudioBuffer | null> => loadSample(url)
  .then(success => (success ? getSampleBuffer(url) || null : null));

export const saveToSampleStore = (file: File): Promise<string> => {
  const id = file.name;
  return decodeFile(file)
    .then((myArrayBuffer) => {
      saveToDB(myArrayBuffer, id);
      return decodeAudio(myArrayBuffer);
    })
    .then((drumBuffer) => {
      sampleStore[id] = drumBuffer;
      return id;
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

export const saveEditedSampleBuffer = (
  audioBuffer: AudioBuffer,
  sourceName?: string,
): Promise<string> => {
  const id = getEditedSampleId(sourceName);
  const wavSourceBuffer = cloneAudioBuffer(audioBuffer);
  const storedBuffer = cloneAudioBuffer(audioBuffer);
  const wavArrayBuffer = audioBufferToWavArrayBuffer(wavSourceBuffer);

  return saveToDB(wavArrayBuffer, id)
    .then(() => {
      sampleStore[id] = storedBuffer;
      return id;
    });
};
