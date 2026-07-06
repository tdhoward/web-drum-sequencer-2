import { fetchFile, decodeFile, decodeAudio } from './fileUtils';

const impulseResponses: Record<string, AudioBuffer> = {};

export const loadImpulseResponse = (fileName: string): Promise<AudioBuffer> => {
  if (typeof impulseResponses[fileName] !== 'undefined') {
    return Promise.resolve(impulseResponses[fileName]);
  }
  return fetchFile(fileName)
    .then(decodeFile)
    .then(decodeAudio);
};
