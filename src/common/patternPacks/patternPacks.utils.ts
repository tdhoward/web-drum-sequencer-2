import {
  DEFAULT_PATTERN_COUNT,
  createPatternsState,
  normalizeNotesState,
  normalizePatternSettings,
  notesStateToLegacyNotes,
} from '../sequencerModel';
import type {
  PatternPack,
  PatternSettings,
  PatternsState,
} from '../sequencerModel';

export const getPatternPackPatternCount = (patternPack: PatternPack): number => Math.max(
  DEFAULT_PATTERN_COUNT,
  patternPack.patternNames?.length || 0,
  patternPack.patternSettings?.length || 0,
  ...Object.values(patternPack.notes).map(channelPatterns => channelPatterns.length),
);

export const getPatternPackPatternNames = (patternPack: PatternPack): string[] => (
  patternPack.patternNames || Array.from(
    { length: getPatternPackPatternCount(patternPack) },
    (_, index) => `Pattern ${index + 1}`,
  )
);

export const getPatternPackPatternSettings = (patternPack: PatternPack): PatternSettings[] => (
  Array.from(
    { length: getPatternPackPatternCount(patternPack) },
    (_, index) => normalizePatternSettings(patternPack.patternSettings?.[index]),
  )
);

export const createPatternsStateForPatternPack = (
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

export const normalizePatternPackState = (patternPack: PatternPack) => {
  const laneIds = patternPack.lanes.map(lane => lane.laneId || lane.id);
  const patterns = createPatternsStateForPatternPack(patternPack, laneIds);
  const notesState = normalizeNotesState(patternPack.notes, patterns.ids, patterns);
  const patternNames = getPatternPackPatternNames(patternPack);

  return {
    bpm: patternPack.bpm,
    swing: patternPack.swing,
    patternNames: patterns.ids.map(
      (_, index) => patternNames[index] || `Pattern ${index + 1}`,
    ),
    patternSettings: getPatternPackPatternSettings(patternPack),
    lanes: patternPack.lanes.map(lane => ({ ...lane })),
    notes: notesStateToLegacyNotes({
      notesState,
      patternsState: patterns,
      laneIds,
    }),
  };
};
