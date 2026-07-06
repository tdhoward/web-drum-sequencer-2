import { loadChannels } from '../channels';
import { setSelectedChannel } from '../master';
import { setKitName } from '../kits';
import { resolveKitChannelMapping } from '../percussion';
import {
  mappingToAssignments,
  replaceKitChannelAssignments,
} from '../kitChannelAssignments';
import presets from '../../presets';
import patternPacks from '../../patternPacks';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import type {
  FactoryPresetChannel,
  LegacyNotes,
  PatternPackLane,
  SequencerRootState,
  SongState,
} from '../sequencerModel';
import { currentKitPresetStateSelector } from './presets.selectors';
import { presetsSlice, type UserPreset } from './presets.reducer';

export const {
  setPreset,
  savePreset,
  savePresetAs,
  deletePreset,
} = presetsSlice.actions;

type Dispatch = (action: unknown) => unknown;

type KitPreset = {
  name: string;
  channels: FactoryPresetChannel[];
  bpm?: number;
  swing?: number;
  notes?: LegacyNotes;
  [key: string]: unknown;
};

type PresetRootState = SequencerRootState & {
  song: SongState;
  patternPacks?: {
    selectedPatternPackId?: string;
  };
};

const getSelectedKitId = (state: SequencerRootState): string => (
  state.song?.selectedKitId || 'default-kit'
);

const channelForKit = (
  kitId: string,
) => (channel: FactoryPresetChannel): FactoryPresetChannel & { kitId: string } => ({
  ...channel,
  kitId,
});

const getCurrentPatternLanes = (state: PresetRootState): PatternPackLane[] => {
  const selectedPatternPackId = state.patternPacks?.selectedPatternPackId;
  const selectedPatternPack = patternPacks.find(
    patternPack => patternPack.id === selectedPatternPackId,
  );
  if (selectedPatternPack) {
    return selectedPatternPack.lanes;
  }

  const selectedPatternId = state.song?.selectedPatternId;
  const selectedPattern = selectedPatternId ? state.patterns?.entities?.[selectedPatternId] : undefined;
  return (selectedPattern?.laneIds || []).map(laneId => ({
    id: laneId,
    laneId,
  }));
};

const resolveAssignmentsForPreset = (
  preset: KitPreset,
  kitId: string,
  state: PresetRootState,
) => {
  const targetKitChannels = preset.channels.map(channelForKit(kitId));
  const currentPatternLanes = getCurrentPatternLanes(state);
  const mappingResult = resolveKitChannelMapping({
    patternLanes: currentPatternLanes,
    sourceKitChannels: currentPatternLanes,
    targetKitChannels,
  });

  return {
    mappingResult,
    assignments: mappingToAssignments(mappingResult.mappings, targetKitChannels),
  };
};

export const loadPreset = (preset: KitPreset) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
) => {
  const state = getState();
  const kitId = getSelectedKitId(state);
  const { mappingResult, assignments } = resolveAssignmentsForPreset(preset, kitId, state);
  dispatch(loadChannels(preset.channels));
  dispatch(setKitName(kitId, preset.name));
  dispatch(setPreset(preset.name));
  dispatch(replaceKitChannelAssignments({ assignments }));
  dispatch(setSelectedChannel(mappingResult.mappings[0]?.laneId || preset.channels[0].id));
  return mappingResult;
};

export const erasePreset = (presetName: string) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
) => {
  const state = getState();
  const kitId = getSelectedKitId(state);
  const emptyPreset = presets[0];
  const { mappingResult, assignments } = resolveAssignmentsForPreset(emptyPreset, kitId, state);
  dispatch(loadChannels(emptyPreset.channels));
  dispatch(setKitName(kitId, emptyPreset.name));
  dispatch(setPreset(emptyPreset.name));
  dispatch(replaceKitChannelAssignments({ assignments }));
  dispatch(setSelectedChannel(mappingResult.mappings[0]?.laneId || emptyPreset.channels[0].id));
  dispatch(deletePreset(presetName));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_DELETED));
  return mappingResult;
};

export const doSavePresetAs = (presetName: string) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
): void => {
  const currentState = currentKitPresetStateSelector(getState());
  const kitId = getSelectedKitId(getState());
  dispatch(savePresetAs({
    ...currentState,
    name: presetName,
  } as UserPreset));
  dispatch(setKitName(kitId, presetName));
  dispatch(setPreset(presetName));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_SAVED));
};

export const doSavePreset = (presetName: string) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
): void => {
  const currentState = currentKitPresetStateSelector(getState());
  dispatch(savePreset({
    ...currentState,
    name: presetName,
  } as UserPreset));
  dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_SAVED));
};
