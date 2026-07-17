import {
  deleteSampleBuffer,
  replaceUserSampleBuffer,
  saveEditedSampleBuffer,
  saveRecordedSampleBuffer,
  saveToSampleStore,
} from '../../services/sampleStore';
import factorySamples from '../../samples.config';
import { loadAndSetChannelSample } from '../channels';
import {
  removeSampleFromUrl,
  renameSampleFromUrl,
  setSampleFingerprint,
} from '../samples';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import {
  getUserSampleId,
  normalizeUserSample,
  userSamplesSlice,
  type UserSamplesState,
} from './userSamples.reducer';

type Dispatch = (action: unknown) => unknown;

type UserSamplesRootState = {
  userSamples?: UserSamplesState;
};

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
  replaceSampleId?: string,
) => (
  dispatch: Dispatch,
  getState: () => UserSamplesRootState,
): Promise<void> => {
  const displayName = sampleName?.trim() || sourceName?.trim() || 'Edited Sample';
  const isFactorySample = factorySamples.some(sample => sample.url === replaceSampleId);
  const existingUserSample = replaceSampleId && !isFactorySample
    ? (getState().userSamples || []).find(
      userSample => getUserSampleId(userSample) === replaceSampleId,
    )
    : undefined;
  const existingUserSampleRecord = existingUserSample
    ? normalizeUserSample(existingUserSample)
    : undefined;
  const saveSample = existingUserSampleRecord
    ? replaceUserSampleBuffer(audioBuffer, existingUserSampleRecord.id)
    : saveEditedSampleBuffer(audioBuffer, displayName);

  return saveSample
    .then(({ id: sampleURL, fingerprint }) => {
      dispatch(addUserSample({
        id: sampleURL,
        name: displayName,
        createdAt: existingUserSampleRecord?.createdAt,
        sourceName: sourceName || existingUserSampleRecord?.sourceName,
        sourceType: 'edited',
        ...fingerprint,
      }));
      if (existingUserSampleRecord) {
        dispatch(renameSampleFromUrl(sampleURL, displayName));
      } else {
        dispatch(loadAndSetChannelSample(channel, sampleURL));
      }
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
