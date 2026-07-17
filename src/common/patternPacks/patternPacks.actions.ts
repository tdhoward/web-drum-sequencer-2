import { resolveKitChannelMapping } from '../percussion';
import patternPacks from '../../patternPacks';
import { setSwing, setBPM } from '../tempo';
import { replacePatternLanes, replacePatternNames, replacePatternSettings } from '../patterns';
import { setNotes } from '../notes';
import { channelsStateSelector } from '../channels';
import {
  mappingToAssignments,
  replaceKitChannelAssignments,
} from '../kitChannelAssignments';
import {
  closeMappingReview,
  needsMappingReview,
  openMappingReview,
} from '../mappingReview';
import { setSelectedChannel } from '../master';
import { setPattern, setSongPatternPackId } from '../song';
import {
  type KitChannel,
  type PatternPack,
  type SequencerRootState,
} from '../sequencerModel';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import {
  deletePatternPack,
  renamePatternPack,
  savePatternPack,
  savePatternPackAs,
  setSelectedPatternPack,
} from './patternPacks.reducer';
import {
  allPatternPacksSelector,
  currentPatternPackStateSelector,
  userPatternPacksSelector,
} from './patternPacks.selectors';
import { stopPlayback } from '../playbackSession';
import { calculatePatternPackContentHash } from '../contentHash';
import {
  createPatternsStateForPatternPack,
  getPatternPackPatternNames,
  getPatternPackPatternSettings,
} from './patternPacks.utils';

type Dispatch = (action: unknown) => void;

type PatternPackMemoryRootState =
  Parameters<typeof allPatternPacksSelector>[0]
  & Parameters<typeof currentPatternPackStateSelector>[0]
  & Parameters<typeof userPatternPacksSelector>[0];

const getSelectedKitChannels = (state: SequencerRootState): KitChannel[] => {
  const selectedKitId = state.song?.selectedKitId;
  const selectedKit = selectedKitId ? state.kits?.entities?.[selectedKitId] : undefined;
  const kitChannels = channelsStateSelector(state);
  const channelIds = selectedKit?.channelIds || kitChannels.ids || [];
  return channelIds
    .map(channelId => kitChannels.entities[channelId])
    .filter((channel): channel is KitChannel => Boolean(channel));
};

const slugify = (value: string): string => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const createPatternPackId = (name: string, existingPatternPacks: PatternPack[]): string => {
  const baseId = `user-${slugify(name) || 'pattern-pack'}`;
  const existingIds = new Set(existingPatternPacks.map(patternPack => patternPack.id));
  let id = baseId;
  let suffix = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return id;
};

const commitPatternPackLoad = (
  patternPack: PatternPack,
  mappings: ReturnType<typeof resolveKitChannelMapping>['mappings'],
  dispatch: Dispatch,
  state: SequencerRootState,
): void => {
  dispatch(stopPlayback());
  const targetKitChannels = getSelectedKitChannels(state);
  const laneIds = patternPack.lanes.map(lane => lane.laneId || lane.id);
  const patternSettings = getPatternPackPatternSettings(patternPack);
  const patterns = createPatternsStateForPatternPack(patternPack, laneIds);

  dispatch(setBPM(patternPack.bpm));
  dispatch(setSwing(patternPack.swing));
  dispatch(replacePatternLanes(laneIds));
  dispatch(replacePatternNames(getPatternPackPatternNames(patternPack)));
  dispatch(replacePatternSettings(patternSettings));
  dispatch(setNotes({
    notes: patternPack.notes,
    patterns,
  }));
  dispatch(replaceKitChannelAssignments({
    assignments: mappingToAssignments(mappings, targetKitChannels),
  }));
  dispatch(setPattern(0));
  dispatch(setSelectedChannel(mappings[0]?.laneId || patternPack.lanes[0]?.laneId));
  dispatch(setSelectedPatternPack(patternPack.id));
  dispatch(setSongPatternPackId(patternPack.id));
};

export const loadPatternPack = (patternPack: PatternPack) => (
  dispatch: Dispatch,
  getState: () => SequencerRootState,
) => {
  const state = getState();
  const targetKitChannels = getSelectedKitChannels(state);
  const mappingResult = resolveKitChannelMapping({
    patternLanes: patternPack.lanes,
    sourceKitChannels: patternPack.lanes,
    targetKitChannels,
  });

  commitPatternPackLoad(patternPack, mappingResult.mappings, dispatch, state);

  return mappingResult;
};

export const requestPatternPackLoad = (patternPack: PatternPack) => (
  dispatch: Dispatch,
  getState: () => SequencerRootState,
) => {
  const state = getState();
  const targetKitChannels = getSelectedKitChannels(state);
  const mappingResult = resolveKitChannelMapping({
    patternLanes: patternPack.lanes,
    sourceKitChannels: patternPack.lanes,
    targetKitChannels,
  });

  if (needsMappingReview(mappingResult)) {
    dispatch(openMappingReview({
      operation: {
        type: 'patternPack',
        patternPack,
      },
      mappingResult,
      targetKitChannels,
    }));
    return mappingResult;
  }

  return loadPatternPack(patternPack)(dispatch, getState);
};

export const applyPatternPackMapping = (
  patternPack: PatternPack,
  mappings: ReturnType<typeof resolveKitChannelMapping>['mappings'],
) => (
  dispatch: Dispatch,
  getState: () => SequencerRootState,
): void => {
  const state = getState();
  commitPatternPackLoad(patternPack, mappings, dispatch, state);
  dispatch(closeMappingReview());
};

export const doSavePatternPackAs = (patternPackName: string) => (
  dispatch: Dispatch,
  getState: () => PatternPackMemoryRootState,
): Promise<void> => {
  const state = getState();
  const id = createPatternPackId(patternPackName, allPatternPacksSelector(state));
  const currentState = currentPatternPackStateSelector(state);
  const patternPack: PatternPack = {
    ...currentState,
    id,
    name: patternPackName,
  };

  return calculatePatternPackContentHash(patternPack).then((contentHash) => {
    dispatch(savePatternPackAs({ ...patternPack, ...contentHash }));
    dispatch(setSelectedPatternPack(id));
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_SAVED));
  });
};

export const doSavePatternPack = (patternPackId: string) => (
  dispatch: Dispatch,
  getState: () => PatternPackMemoryRootState,
): Promise<void> => {
  const state = getState();
  const userPatternPack = (userPatternPacksSelector(state) || []).find(
    patternPack => patternPack.id === patternPackId,
  );

  if (!userPatternPack) {
    return Promise.resolve();
  }

  const patternPack: PatternPack = {
    ...currentPatternPackStateSelector(state),
    id: userPatternPack.id,
    name: userPatternPack.name,
  };
  return calculatePatternPackContentHash(patternPack).then((contentHash) => {
    dispatch(savePatternPack({ ...patternPack, ...contentHash }));
    dispatch(setSelectedPatternPack(userPatternPack.id));
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_SAVED));
  });
};

export const erasePatternPack = (patternPackId: string) => (
  dispatch: Dispatch,
): void => {
  const emptyPatternPack = patternPacks[0];

  if (emptyPatternPack) {
    dispatch(loadPatternPack(emptyPatternPack));
  }

  dispatch(deletePatternPack(patternPackId));
  dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_DELETED));
};

export const doRenamePatternPack = (patternPackId: string, name: string) => (
  dispatch: Dispatch,
): void => {
  dispatch(renamePatternPack({ id: patternPackId, name }));
};
