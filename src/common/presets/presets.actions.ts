import { loadChannels } from '../channels';
import { setSelectedChannel } from '../master';
import { kitIdFromPresetName, setKitName } from '../kits';
import { setSelectedKitId } from '../song';
import { resolveKitChannelMapping } from '../percussion';
import {
  mappingToAssignments,
  replaceKitChannelAssignments,
} from '../kitChannelAssignments';
import {
  closeMappingReview,
  needsMappingReview,
  openMappingReview,
  type MappingReviewKitPreset,
} from '../mappingReview';
import presets from '../../presets';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import type {
  FactoryPresetChannel,
  LegacyNotes,
  PatternPackLane,
  SequencerRootState,
  SongState,
} from '../sequencerModel';
import { currentKitPresetStateSelector } from './presets.selectors';
import { presetsSlice, type PresetsState, type UserPreset } from './presets.reducer';
import { calculateKitPresetContentHash } from '../../services/libraryContentHash';
import { selectedPatternPackSelector } from '../patternPacks/patternPacks.selectors';

export const {
  setPreset,
  savePreset,
  savePresetAs,
  renamePreset,
  deletePreset,
} = presetsSlice.actions;

type Dispatch = (action: unknown) => unknown;

type KitPreset = MappingReviewKitPreset & {
  bpm?: number;
  swing?: number;
  notes?: LegacyNotes;
};

type PresetRootState = SequencerRootState & {
  song: SongState;
  presets?: PresetsState;
  patternPacks?: {
    selectedPatternPackId?: string;
  };
};

const channelForKit = (
  kitId: string,
) => (channel: FactoryPresetChannel): FactoryPresetChannel & { kitId: string } => ({
  ...channel,
  kitId,
});

const getCurrentPatternLanes = (state: PresetRootState): PatternPackLane[] => {
  const selectedPatternPack = selectedPatternPackSelector(state);
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

const commitPresetLoad = (
  preset: KitPreset,
  mappings: ReturnType<typeof resolveAssignmentsForPreset>['mappingResult']['mappings'],
  dispatch: Dispatch,
) => {
  const kitId = preset.kitId || kitIdFromPresetName(preset.name);
  const targetKitChannels = preset.channels.map(channelForKit(kitId));
  dispatch(setSelectedKitId(kitId));
  dispatch(loadChannels(preset.channels, kitId));
  dispatch(setKitName(kitId, preset.name));
  dispatch(setPreset(preset.name));
  dispatch(replaceKitChannelAssignments({
    assignments: mappingToAssignments(mappings, targetKitChannels),
  }));
  dispatch(setSelectedChannel(mappings[0]?.laneId || preset.channels[0]?.id));
};

export const loadPreset = (preset: KitPreset) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
) => {
  const state = getState();
  const kitId = preset.kitId || kitIdFromPresetName(preset.name);
  const { mappingResult } = resolveAssignmentsForPreset(preset, kitId, state);
  commitPresetLoad(preset, mappingResult.mappings, dispatch);
  return mappingResult;
};

export const requestPresetLoad = (preset: KitPreset) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
) => {
  const state = getState();
  const kitId = preset.kitId || kitIdFromPresetName(preset.name);
  const targetKitChannels = preset.channels.map(channelForKit(kitId));
  const { mappingResult } = resolveAssignmentsForPreset(preset, kitId, state);

  if (needsMappingReview(mappingResult)) {
    dispatch(openMappingReview({
      operation: {
        type: 'kitPreset',
        preset,
      },
      mappingResult,
      targetKitChannels,
    }));
    return mappingResult;
  }

  commitPresetLoad(preset, mappingResult.mappings, dispatch);
  return mappingResult;
};

export const applyPresetMapping = (
  preset: KitPreset,
  mappings: ReturnType<typeof resolveAssignmentsForPreset>['mappingResult']['mappings'],
) => (dispatch: Dispatch): void => {
  commitPresetLoad(preset, mappings, dispatch);
  dispatch(closeMappingReview());
};

export const erasePreset = (presetName: string) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
) => {
  const state = getState();
  const emptyPreset = presets[0];
  const kitId = kitIdFromPresetName(emptyPreset.name);
  const { mappingResult, assignments } = resolveAssignmentsForPreset(emptyPreset, kitId, state);
  dispatch(setSelectedKitId(kitId));
  dispatch(loadChannels(emptyPreset.channels, kitId));
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
): Promise<void> => {
  const currentState = currentKitPresetStateSelector(getState());
  return calculateKitPresetContentHash(currentState).then(({ hash }) => {
    const savedPreset = {
      ...currentState,
      ...hash,
      name: presetName,
    } as UserPreset;
    dispatch(savePresetAs(savedPreset));
    dispatch(loadPreset(savedPreset as unknown as KitPreset));
    dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_SAVED));
  });
};

export const doSavePreset = (presetName: string) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
): Promise<void> => {
  const currentState = currentKitPresetStateSelector(getState());
  return calculateKitPresetContentHash(currentState).then(({ hash }) => {
    dispatch(savePreset({
      ...currentState,
      ...hash,
      name: presetName,
    } as UserPreset));
    dispatch(showFlashMessage(FLASH_MESSAGES.PRESET_SAVED));
  });
};

export const doRenamePreset = (presetName: string, name: string) => (
  dispatch: Dispatch,
  getState: () => PresetRootState,
): void => {
  const state = getState();
  const preset = state.presets?.userPresets.find(
    userPreset => userPreset.name === presetName,
  );
  if (!preset) return;

  const kitId = preset.kitId || state.song.selectedKitId || kitIdFromPresetName(presetName);
  dispatch(renamePreset({ presetName, name, kitId }));
  dispatch(setKitName(kitId, name));
};
