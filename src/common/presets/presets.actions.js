import { loadChannels } from '../channels';
import { setSelectedChannel } from '../master';
import { selectedKitIdSelector } from '../song';
import { setKitName } from '../kits';
import { resolveKitChannelMapping } from '../percussion';
import {
  mappingToAssignments,
  replaceKitChannelAssignments,
} from '../kitChannelAssignments';
import { patternsSelector } from '../patterns';
import presets from '../../presets';
import patternPacks from '../../patternPacks';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { currentKitPresetStateSelector } from './presets.selectors';
import { presetsSlice } from './presets.reducer';

export const {
  setPreset,
  savePreset,
  savePresetAs,
  deletePreset,
} = presetsSlice.actions;

const channelForKit = kitId => channel => ({
  ...channel,
  kitId,
});

const getCurrentPatternLanes = (state) => {
  const selectedPatternPackId = state.patternPacks?.selectedPatternPackId;
  const selectedPatternPack = patternPacks.find(
    patternPack => patternPack.id === selectedPatternPackId,
  );
  if (selectedPatternPack) {
    return selectedPatternPack.lanes;
  }

  const patterns = patternsSelector(state);
  const selectedPatternId = state.song?.selectedPatternId;
  const selectedPattern = patterns?.entities?.[selectedPatternId];
  return (selectedPattern?.laneIds || []).map(laneId => ({
    id: laneId,
    laneId,
  }));
};

const resolveAssignmentsForPreset = (preset, kitId, state) => {
  const targetKitChannels = preset.channels.map(channelForKit(kitId));
  const mappingResult = resolveKitChannelMapping({
    patternLanes: getCurrentPatternLanes(state),
    sourceKitChannels: getCurrentPatternLanes(state),
    targetKitChannels,
  });

  return {
    mappingResult,
    assignments: mappingToAssignments(mappingResult.mappings, targetKitChannels),
  };
};

export const loadPreset = preset => (dispatch, getState) => {
  const state = getState();
  const kitId = selectedKitIdSelector(state);
  const { mappingResult, assignments } = resolveAssignmentsForPreset(preset, kitId, state);
  dispatch(loadChannels(preset.channels));
  dispatch(setKitName(kitId, preset.name));
  dispatch(setPreset(preset.name));
  dispatch(replaceKitChannelAssignments({ assignments }));
  dispatch(setSelectedChannel(mappingResult.mappings[0]?.laneId || preset.channels[0].id));
  return mappingResult;
};

export const erasePreset = presetName => (dispatch, getState) => {
  const state = getState();
  const kitId = selectedKitIdSelector(state);
  const { mappingResult, assignments } = resolveAssignmentsForPreset(presets[0], kitId, state);
  dispatch(loadChannels(presets[0].channels));
  dispatch(setKitName(kitId, presets[0].name));
  dispatch(setPreset(presets[0].name));
  dispatch(replaceKitChannelAssignments({ assignments }));
  dispatch(setSelectedChannel(mappingResult.mappings[0]?.laneId || presets[0].channels[0].id));
  dispatch(deletePreset(presetName));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_DELETED));
  return mappingResult;
};

export const doSavePresetAs = presetName => (dispatch, getState) => {
  const currentState = currentKitPresetStateSelector(getState());
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
  const currentState = currentKitPresetStateSelector(getState());
  dispatch(savePreset({
    ...currentState,
    name: presetName,
  }));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_SAVED));
};
