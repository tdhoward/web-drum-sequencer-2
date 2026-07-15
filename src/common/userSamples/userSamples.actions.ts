import {
  deleteSampleBuffer,
  saveEditedSampleBuffer,
  saveRecordedSampleBuffer,
  saveToSampleStore,
} from '../../services/sampleStore';
import { loadAndSetChannelSample } from '../channels';
import {
  removeSampleFromUrl,
  renameSampleFromUrl,
  setSampleFingerprint,
} from '../samples';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { userSamplesSlice } from './userSamples.reducer';

type Dispatch = (action: unknown) => unknown;

export const {
  addUserSample,
  renameUserSample,
  removeUserSample,
  clearUserSamples,
  setUserSampleFingerprint,
} = userSamplesSlice.actions;

export const saveUserSample = (channel: string, files: FileList | File[]) => (
  dispatch: Dispatch,
): void => {
  const file = files[0];

  saveToSampleStore(file)
    .then(({ id: sampleURL, fingerprint }) => {
      dispatch(addUserSample({
        id: sampleURL,
        name: file.name,
        sourceType: 'uploaded',
        ...fingerprint,
      }));
      dispatch(loadAndSetChannelSample(channel, sampleURL));
      dispatch(setSampleFingerprint(sampleURL, fingerprint));
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
    .then(({ id: sampleURL, fingerprint }) => {
      dispatch(addUserSample({
        id: sampleURL,
        name: displayName,
        sourceName,
        sourceType: 'edited',
        ...fingerprint,
      }));
      dispatch(loadAndSetChannelSample(channel, sampleURL));
      dispatch(setSampleFingerprint(sampleURL, fingerprint));
    })
    .catch((error) => {
      dispatch(showFlashMessage(FLASH_MESSAGES.SAMPLE_LOAD_ERROR));
      return Promise.reject(error);
    });
};

export const saveRecordedUserSample = (
  channel: string,
  audioBuffer: AudioBuffer,
  sampleName?: string,
) => (
  dispatch: Dispatch,
): Promise<void> => {
  const displayName = sampleName?.trim() || 'Recorded Sample';

  return saveRecordedSampleBuffer(audioBuffer, displayName)
    .then(({ id: sampleURL, fingerprint }) => {
      dispatch(addUserSample({
        id: sampleURL,
        name: displayName,
        sourceType: 'recorded',
        ...fingerprint,
      }));
      dispatch(loadAndSetChannelSample(channel, sampleURL));
      dispatch(setSampleFingerprint(sampleURL, fingerprint));
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
