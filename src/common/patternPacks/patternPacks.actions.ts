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
import { setSelectedChannel } from '../master';
import { setPattern } from '../song';
import {
  DEFAULT_PATTERN_COUNT,
  createPatternsState,
  normalizePatternSettings,
  type KitChannel,
  type PatternPack,
  type PatternSettings,
  type PatternsState,
  type SequencerRootState,
} from '../sequencerModel';
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

const getPatternPackPatternCount = (patternPack: PatternPack): number => Math.max(
  DEFAULT_PATTERN_COUNT,
  patternPack.patternNames?.length || 0,
  patternPack.patternSettings?.length || 0,
  ...Object.values(patternPack.notes).map(channelPatterns => channelPatterns.length),
);

const getPatternPackPatternNames = (patternPack: PatternPack): string[] => (
  patternPack.patternNames || Array.from(
    { length: getPatternPackPatternCount(patternPack) },
    (_, index) => `Pattern ${index + 1}`,
  )
);

const getPatternPackPatternSettings = (patternPack: PatternPack): PatternSettings[] => (
  Array.from(
    { length: getPatternPackPatternCount(patternPack) },
    (_, index) => normalizePatternSettings(patternPack.patternSettings?.[index]),
  )
);

const createPatternsStateForPatternPack = (
  patternPack: PatternPack,
  laneIds: string[],
): PatternsState => {
  const patternSettings = getPatternPackPatternSettings(patternPack);
  const patterns = createPatternsState({
    patternCount: getPatternPackPatternCount(patternPack),
    laneIds,
  });

  patterns.ids.forEach((patternId, index) => {
    patterns.entities[patternId] = {
      ...patterns.entities[patternId],
      ...patternSettings[index],
    };
  });

  return patterns;
};

export const loadPatternPack = (patternPack: PatternPack) => (
  dispatch: Dispatch,
  getState: () => SequencerRootState,
) => {
  const state = getState();
  const targetKitChannels = getSelectedKitChannels(state);
  const laneIds = patternPack.lanes.map(lane => lane.laneId || lane.id);
  const patternSettings = getPatternPackPatternSettings(patternPack);
  const patterns = createPatternsStateForPatternPack(patternPack, laneIds);
  const mappingResult = resolveKitChannelMapping({
    patternLanes: patternPack.lanes,
    sourceKitChannels: patternPack.lanes,
    targetKitChannels,
  });

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
