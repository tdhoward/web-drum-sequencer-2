import type {
  KitChannelMapping,
  KitChannelMappingResult,
  TargetKitChannel,
  UnresolvedKitChannelMapping,
} from '../percussion';

export type MappingReviewSelections = Record<string, string | null>;

export type MappingReviewRow = {
  laneId: string;
  source: KitChannelMapping['source'];
  mapping?: KitChannelMapping;
  unresolved?: UnresolvedKitChannelMapping;
};

export const needsMappingReview = ({
  mappings,
  unresolved,
}: KitChannelMappingResult): boolean => (
  unresolved.length > 0 || mappings.some(mapping => mapping.confidence === 'low')
);

export const createMappingReviewRows = (
  mappingResult: KitChannelMappingResult,
): MappingReviewRow[] => [
  ...mappingResult.mappings.map(mapping => ({
    laneId: mapping.laneId,
    source: mapping.source,
    mapping,
  })),
  ...mappingResult.unresolved.map(unresolved => ({
    laneId: unresolved.laneId,
    source: unresolved.source,
    unresolved,
  })),
];

export const createInitialMappingReviewSelections = (
  mappingResult: KitChannelMappingResult,
): MappingReviewSelections => createMappingReviewRows(mappingResult)
  .reduce<MappingReviewSelections>((selections, row) => ({
    ...selections,
    [row.laneId]: row.mapping?.targetKitChannelId || null,
  }), {});

export const updateMappingReviewSelection = (
  currentSelections: MappingReviewSelections,
  laneId: string,
  targetKitChannelId: string | null,
): MappingReviewSelections => {
  const previousTarget = currentSelections[laneId] || null;
  const conflictingLaneId = targetKitChannelId
    ? Object.keys(currentSelections).find(
      currentLaneId => currentLaneId !== laneId
        && currentSelections[currentLaneId] === targetKitChannelId,
    )
    : undefined;
  const nextSelections = {
    ...currentSelections,
    [laneId]: targetKitChannelId,
  };

  if (conflictingLaneId) {
    nextSelections[conflictingLaneId] = previousTarget;
  }
  return nextSelections;
};

export const createReviewedMappings = (
  mappingResult: KitChannelMappingResult,
  targetKitChannels: TargetKitChannel[],
  selections: MappingReviewSelections,
): KitChannelMapping[] => {
  const targetsById = targetKitChannels.reduce<Record<string, TargetKitChannel>>(
    (targets, target) => ({
      ...targets,
      [target.id]: target,
    }),
    {},
  );

  return createMappingReviewRows(mappingResult).reduce<KitChannelMapping[]>((mappings, row) => {
    const targetKitChannelId = selections[row.laneId];
    const target = targetKitChannelId ? targetsById[targetKitChannelId] : undefined;
    if (!targetKitChannelId || !target) return mappings;

    if (row.mapping?.targetKitChannelId === targetKitChannelId) {
      mappings.push(row.mapping);
      return mappings;
    }

    mappings.push({
      laneId: row.laneId,
      source: row.source,
      targetKitChannelId,
      target,
      confidence: 'manual',
      reason: 'selected manually during mapping review',
    });
    return mappings;
  }, []);
};
