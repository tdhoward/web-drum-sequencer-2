import { MASTER_CONSTANTS } from './master.constants';

export const setPreset = presetName => ({
  type: MASTER_CONSTANTS.SET_PRESET,
  payload: presetName,
});
