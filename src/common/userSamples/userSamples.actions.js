import { saveToSampleStore } from '../../services/sampleStore';
import { loadAndSetChannelSample } from '../channels';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { userSamplesSlice } from './userSamples.reducer';

export const {
  addUserSample,
  removeUserSample,
  clearUserSamples,
} = userSamplesSlice.actions;

export const saveUserSample = (channel, files) => (dispatch) => {
  saveToSampleStore(files[0])
    .then((sampleURL) => {
      dispatch(addUserSample(sampleURL));
      dispatch(loadAndSetChannelSample(channel, sampleURL));
    })
    .catch(() => {
      dispatch(showFlashMessage(FLASH_MESSAGES.SAMPLE_LOAD_ERROR));
    });
};
