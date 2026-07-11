import { createSelector } from 'reselect';
import patternPacks from '../../patternPacks';
import { channelsSelector, type LegacyChannel } from '../channels';
import { notesStateSelector } from '../notes';
import { patternsSelector } from '../patterns';
import { bpmSelector, swingSelector } from '../tempo';
import { normalizePatternSettings, notesStateToLegacyNotes } from '../sequencerModel';
import type {
  LegacyNotes,
  NotesState,
  PatternSettings,
  PatternPack,
  PatternPackLane,
  PatternsState,
} from '../sequencerModel';
import type { PatternPacksState } from './patternPacks.reducer';

type CurrentPatternPackState = {
  bpm: number;
  swing: number;
  patternNames: string[];
  patternSettings: PatternSettings[];
  lanes: PatternPackLane[];
  notes: LegacyNotes;
};

type PatternPacksRootState = {
  patternPacks?: PatternPacksState;
};

export const selectedPatternPackIdSelector = (
  state: PatternPacksRootState,
): string | undefined => state.patternPacks?.selectedPatternPackId;

export const userPatternPacksSelector = (
  state: PatternPacksRootState,
): PatternPack[] | undefined => state.patternPacks?.userPatternPacks;

export const allPatternPacksSelector = createSelector(
  userPatternPacksSelector,
  (userPatternPacks = []): PatternPack[] => [...patternPacks, ...userPatternPacks],
);

export const selectedPatternPackSelector = createSelector(
  selectedPatternPackIdSelector,
  allPatternPacksSelector,
  (selectedPatternPackId, allPatternPacks): PatternPack | undefined => allPatternPacks.find(
    patternPack => patternPack.id === selectedPatternPackId,
  ),
);

const getPatternLaneIds = (patterns: PatternsState): string[] => (
  patterns.ids.reduce<string[]>((laneIds, patternId) => {
    const pattern = patterns.entities[patternId];
    if (!pattern) {
      return laneIds;
    }

    pattern.laneIds.forEach((laneId) => {
      if (!laneIds.includes(laneId)) {
        laneIds.push(laneId);
      }
    });

    return laneIds;
  }, [])
);

const getLaneId = (lane: { id: string; laneId?: string }): string => lane.laneId || lane.id;

const copyPackLane = (lane: PatternPackLane): PatternPackLane => ({ ...lane });

const channelToPatternPackLane = (channel: LegacyChannel): PatternPackLane => {
  const {
    id,
    name,
    percussionType,
    articulation,
    register,
    tags,
  } = channel;

  return {
    id,
    laneId: id,
    name: name || id,
    percussionType,
    articulation,
    register,
    tags,
  };
};

const fallbackLane = (laneId: string): PatternPackLane => ({
  id: laneId,
  laneId,
  name: laneId,
});

const createPatternPackLanes = (
  laneIds: string[],
  selectedPatternPack: PatternPack | undefined,
  channels: LegacyChannel[],
): PatternPackLane[] => {
  const selectedPackLanesById = (selectedPatternPack?.lanes || []).reduce<
    Record<string, PatternPackLane>
  >((lanesById, lane) => ({
    ...lanesById,
    [getLaneId(lane)]: lane,
  }), {});
  const channelsByLaneId = channels.reduce<Record<string, LegacyChannel>>((channelsById, channel) => ({
    ...channelsById,
    [channel.id]: channel,
  }), {});

  return laneIds.map((laneId) => {
    const existingLane = selectedPackLanesById[laneId];
    if (existingLane) {
      return copyPackLane(existingLane);
    }

    const channel = channelsByLaneId[laneId];
    if (channel) {
      return channelToPatternPackLane(channel);
    }

    return fallbackLane(laneId);
  });
};

const createPatternNames = (patterns: PatternsState): string[] => (
  patterns.ids.map((patternId, index) => (
    patterns.entities[patternId]?.name || `Pattern ${index + 1}`
  ))
);

const createPatternSettings = (patterns: PatternsState): PatternSettings[] => (
  patterns.ids.map(patternId => normalizePatternSettings(patterns.entities[patternId]))
);

export const currentPatternPackStateSelector = createSelector(
  bpmSelector,
  swingSelector,
  patternsSelector,
  notesStateSelector,
  selectedPatternPackSelector,
  channelsSelector,
  (
    bpm: number,
    swing: number,
    patterns: PatternsState,
    notesState: NotesState,
    selectedPatternPack: PatternPack | undefined,
    channels: LegacyChannel[],
  ): CurrentPatternPackState => {
    const laneIds = getPatternLaneIds(patterns);

    return {
      bpm,
      swing,
      patternNames: createPatternNames(patterns),
      patternSettings: createPatternSettings(patterns),
      lanes: createPatternPackLanes(laneIds, selectedPatternPack, channels),
      notes: notesStateToLegacyNotes({
        notesState,
        patternsState: patterns,
        laneIds,
      }),
    };
  },
);
