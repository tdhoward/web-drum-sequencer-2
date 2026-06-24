import { setBPM, setSwing } from '../tempo';
import { loadChannels } from '../channels';
import { setSelectedChannel } from '../master';
import { selectedKitIdSelector, setPattern } from '../song';
import { setKitName } from '../kits';
import presets from '../../presets';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { currentStateSelector } from './presets.selectors';
import { presetsSlice } from './presets.reducer';

export const {
  setPreset,
  savePreset,
  savePresetAs,
  deletePreset,
} = presetsSlice.actions;

export const loadPreset = preset => (dispatch, getState) => {
  const kitId = selectedKitIdSelector(getState());
  dispatch(setBPM(preset.bpm));
  dispatch(setSwing(preset.swing));
  dispatch(loadChannels(preset.channels, preset.notes));
  dispatch(setKitName(kitId, preset.name));
  dispatch(setPreset(preset.name));
  dispatch(setPattern(0));
  dispatch(setSelectedChannel(preset.channels[0].id));
};

export const erasePreset = presetName => (dispatch, getState) => {
  const kitId = selectedKitIdSelector(getState());
  dispatch(setBPM(presets[0].bpm));
  dispatch(setSwing(presets[0].swing));
  dispatch(loadChannels(presets[0].channels, presets[0].notes));
  dispatch(setKitName(kitId, presets[0].name));
  dispatch(setPreset(presets[0].name));
  dispatch(setPattern(0));
  dispatch(setSelectedChannel(presets[0].channels[0].id));
  dispatch(deletePreset(presetName));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_DELETED));
};

export const doSavePresetAs = presetName => (dispatch, getState) => {
  const currentState = currentStateSelector(getState());
  const kitId = selectedKitIdSelector(getState());
  dispatch(savePresetAs({
    ...currentState,
    name: presetName,
  }));
  dispatch(setKitName(kitId, presetName));
  dispatch(setPreset(presetName));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_SAVED));
};

export const doSavePreset = presetName => (dispatch, getState) => {
  const currentState = currentStateSelector(getState());
  dispatch(savePreset({
    ...currentState,
    name: presetName,
  }));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_SAVED));
};
