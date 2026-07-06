import { deleteSampleBuffer, saveEditedSampleBuffer, saveToSampleStore } from '../../services/sampleStore';
import { loadAndSetChannelSample } from '../channels';
import { removeSampleFromUrl, renameSampleFromUrl } from '../samples';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { userSamplesSlice } from './userSamples.reducer';

type Dispatch = (action: unknown) => unknown;

export const {
  addUserSample,
  renameUserSample,
  removeUserSample,
  clearUserSamples,
} = userSamplesSlice.actions;

export const saveUserSample = (channel: string, files: FileList | File[]) => (
  dispatch: Dispatch,
): void => {
  const file = files[0];

  saveToSampleStore(file)
    .then((sampleURL: string) => {
      dispatch(addUserSample({
        id: sampleURL,
        name: file.name,
        sourceType: 'uploaded',
      }));
      dispatch(loadAndSetChannelSample(channel, sampleURL));
    })
    .catch(() => {
      dispatch(showFlashMessage(FLASH_MESSAGES.SAMPLE_LOAD_ERROR));
    });
};

export const saveEditedUserSample = (
  channel: string,
  audioBuffer: AudioBuffer,
  sourceName?: string,
  sampleName?: string,
) => (
  dispatch: Dispatch,
): Promise<void> => {
  const displayName = sampleName?.trim() || sourceName?.trim() || 'Edited Sample';

  return saveEditedSampleBuffer(audioBuffer, displayName)
    .then((sampleURL: string) => {
      dispatch(addUserSample({
        id: sampleURL,
        name: displayName,
        sourceName,
        sourceType: 'edited',
      }));
      dispatch(loadAndSetChannelSample(channel, sampleURL));
    })
    .catch((error) => {
      dispatch(showFlashMessage(FLASH_MESSAGES.SAMPLE_LOAD_ERROR));
      return Promise.reject(error);
    });
};

export const renameSavedUserSample = (sampleId: string, name: string) => (
  dispatch: Dispatch,
): void => {
  dispatch(renameUserSample(sampleId, name));
  dispatch(renameSampleFromUrl(sampleId, name));
};

export const deleteSavedUserSample = (sampleId: string) => (
  dispatch: Dispatch,
): Promise<void> => deleteSampleBuffer(sampleId)
  .then(() => {
    dispatch(removeUserSample(sampleId));
    dispatch(removeSampleFromUrl(sampleId));
  })
  .catch((error) => {
    dispatch(showFlashMessage(FLASH_MESSAGES.SAMPLE_LOAD_ERROR));
    return Promise.reject(error);
  });
