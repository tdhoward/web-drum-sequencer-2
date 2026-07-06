import { getAudioContext } from './audioContext';

export const fetchFile = (url: string): Promise<Blob> => new Promise(
  (resolve, reject) => {
    fetch(url).then((response) => {
      if (response.ok) {
        resolve(response.blob());
      }
      reject(new Error('Network response was not ok.'));
    });
  },
);

export const decodeFile = (sampleBlob: Blob): Promise<ArrayBuffer> => new Promise(
  (resolve) => {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(sampleBlob);
    fileReader.onloadend = () => {
      resolve(fileReader.result as ArrayBuffer);
    };
  },
);

export const decodeAudio = (audioArrayBuffer: ArrayBuffer): Promise<AudioBuffer> => new Promise(
  (resolve, reject) => {
    getAudioContext().decodeAudioData(audioArrayBuffer, resolve, reject);
  },
);
