import { resolveKitChannelMapping } from '../percussion';
import patternPacks from '../../patternPacks';
import { setSwing, setBPM } from '../tempo';
import { replacePatternLanes } from '../patterns';
import { setNotes } from '../notes';
import { channelsStateSelector } from '../channels';
import {
  mappingToAssignments,
  replaceKitChannelAssignments,
} from '../kitChannelAssignments';
import { setSelectedChannel } from '../master';
import { setPattern } from '../song';
import type { KitChannel, PatternPack, SequencerRootState } from '../sequencerModel';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import {
  deletePatternPack,
  savePatternPack,
  savePatternPackAs,
  setSelectedPatternPack,
} from './patternPacks.reducer';
import {
  allPatternPacksSelector,
  currentPatternPackStateSelector,
  userPatternPacksSelector,
} from './patternPacks.selectors';

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

const createPatternPackId = (name: string, existingPatternPacks: PatternPack[]): string => {
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

  dispatch(setBPM(patternPack.bpm));
  dispatch(setSwing(patternPack.swing));
  dispatch(replacePatternLanes(patternPack.lanes.map(lane => lane.laneId || lane.id)));
  dispatch(setNotes(patternPack.notes));
  dispatch(replaceKitChannelAssignments({
    assignments: mappingToAssignments(mappingResult.mappings, targetKitChannels),
  }));
  dispatch(setPattern(0));
  dispatch(setSelectedChannel(mappingResult.mappings[0]?.laneId || patternPack.lanes[0]?.laneId));
  dispatch(setSelectedPatternPack(patternPack.id));

  return mappingResult;
};

export const doSavePatternPackAs = (patternPackName: string) => (
  dispatch: Dispatch,
  getState: () => PatternPackMemoryRootState,
): void => {
  const state = getState();
  const id = createPatternPackId(patternPackName, allPatternPacksSelector(state));
  const currentState = currentPatternPackStateSelector(state);

  dispatch(savePatternPackAs({
    ...currentState,
    id,
    name: patternPackName,
  }));
  dispatch(setSelectedPatternPack(id));
  dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_SAVED));
};

export const doSavePatternPack = (patternPackId: string) => (
  dispatch: Dispatch,
  getState: () => PatternPackMemoryRootState,
): void => {
  const state = getState();
  const userPatternPack = (userPatternPacksSelector(state) || []).find(
    patternPack => patternPack.id === patternPackId,
  );

  if (!userPatternPack) {
    return;
  }

  dispatch(savePatternPack({
    ...currentPatternPackStateSelector(state),
    id: userPatternPack.id,
    name: userPatternPack.name,
  }));
  dispatch(setSelectedPatternPack(userPatternPack.id));
  dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_SAVED));
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
