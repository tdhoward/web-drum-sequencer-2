export const PERCUSSION_TYPES = {
  BASS_DRUM: 'bass_drum',
  SNARE_DRUM: 'snare_drum',
  CLOSED_HI_HAT: 'closed_hi_hat',
  OPEN_HI_HAT: 'open_hi_hat',
  PEDAL_HI_HAT: 'pedal_hi_hat',
  CLAP: 'clap',
  RIMSHOT: 'rimshot',
  TOM_HIGH: 'tom_high',
  TOM_MID: 'tom_mid',
  TOM_LOW: 'tom_low',
  RIDE_CYMBAL: 'ride_cymbal',
  CRASH_CYMBAL: 'crash_cymbal',
  CYMBAL: 'cymbal',
  SHAKER: 'shaker',
  TAMBOURINE: 'tambourine',
  COWBELL: 'cowbell',
  CLAVE: 'clave',
  GENERIC_PERCUSSION: 'generic_percussion',
} as const;

export type PercussionType = typeof PERCUSSION_TYPES[keyof typeof PERCUSSION_TYPES];

export type PercussionTypeDetails = {
  label: string;
  abbreviation: string;
};

export type PercussionTypeOption = PercussionTypeDetails & {
  type: PercussionType;
};

export type KitChannelMetadata = {
  id?: string;
  laneId?: string;
  name?: string;
  percussionType?: string;
  articulation?: string;
  register?: string;
  tags?: string[];
  [key: string]: unknown;
};

export type TargetKitChannel = KitChannelMetadata & {
  id: string;
};

export type PatternLane = string | KitChannelMetadata;

export type EnrichedPatternLane = KitChannelMetadata & {
  id: string;
  laneId: string;
};

export type MappingConfidence = 'high' | 'medium' | 'low' | 'manual' | 'unresolved';

export type KitChannelMapping = {
  laneId: string;
  source: EnrichedPatternLane;
  targetKitChannelId: string;
  target: TargetKitChannel;
  confidence: MappingConfidence;
  reason: string;
};

export type UnresolvedKitChannelMapping = {
  laneId: string;
  source: EnrichedPatternLane;
  reason: string;
};

export type KitChannelMappingResult = {
  mappings: KitChannelMapping[];
  unresolved: UnresolvedKitChannelMapping[];
};

export type ResolveKitChannelMappingArgs = {
  patternLanes?: PatternLane[];
  sourceKitChannels?: KitChannelMetadata[];
  targetKitChannels?: TargetKitChannel[];
};

type CandidateScore = {
  score: number;
  confidence: MappingConfidence;
  reason: string;
};

type MappingCandidate = CandidateScore & {
  channel: TargetKitChannel;
};

export const VALID_PERCUSSION_TYPES: PercussionType[] = Object.values(PERCUSSION_TYPES);

export const PERCUSSION_TYPE_DETAILS: Record<PercussionType, PercussionTypeDetails> = {
  [PERCUSSION_TYPES.BASS_DRUM]: {
    label: 'Bass Drum',
    abbreviation: 'BD',
  },
  [PERCUSSION_TYPES.SNARE_DRUM]: {
    label: 'Snare Drum',
    abbreviation: 'SD',
  },
  [PERCUSSION_TYPES.CLOSED_HI_HAT]: {
    label: 'Closed Hi-Hat',
    abbreviation: 'CH',
  },
  [PERCUSSION_TYPES.OPEN_HI_HAT]: {
    label: 'Open Hi-Hat',
    abbreviation: 'OH',
  },
  [PERCUSSION_TYPES.PEDAL_HI_HAT]: {
    label: 'Pedal Hi-Hat',
    abbreviation: 'PH',
  },
  [PERCUSSION_TYPES.CLAP]: {
    label: 'Clap',
    abbreviation: 'CP',
  },
  [PERCUSSION_TYPES.RIMSHOT]: {
    label: 'Rimshot',
    abbreviation: 'RS',
  },
  [PERCUSSION_TYPES.TOM_HIGH]: {
    label: 'High Tom',
    abbreviation: 'HT',
  },
  [PERCUSSION_TYPES.TOM_MID]: {
    label: 'Mid Tom',
    abbreviation: 'MT',
  },
  [PERCUSSION_TYPES.TOM_LOW]: {
    label: 'Low Tom',
    abbreviation: 'LT',
  },
  [PERCUSSION_TYPES.RIDE_CYMBAL]: {
    label: 'Ride Cymbal',
    abbreviation: 'RD',
  },
  [PERCUSSION_TYPES.CRASH_CYMBAL]: {
    label: 'Crash Cymbal',
    abbreviation: 'CR',
  },
  [PERCUSSION_TYPES.CYMBAL]: {
    label: 'Cymbal',
    abbreviation: 'CY',
  },
  [PERCUSSION_TYPES.SHAKER]: {
    label: 'Shaker',
    abbreviation: 'SH',
  },
  [PERCUSSION_TYPES.TAMBOURINE]: {
    label: 'Tambourine',
    abbreviation: 'TB',
  },
  [PERCUSSION_TYPES.COWBELL]: {
    label: 'Cowbell',
    abbreviation: 'CB',
  },
  [PERCUSSION_TYPES.CLAVE]: {
    label: 'Clave',
    abbreviation: 'CV',
  },
  [PERCUSSION_TYPES.GENERIC_PERCUSSION]: {
    label: 'Generic Percussion',
    abbreviation: 'GP',
  },
};

export const PERCUSSION_TYPE_OPTIONS: PercussionTypeOption[] = VALID_PERCUSSION_TYPES.map(type => ({
  type,
  ...PERCUSSION_TYPE_DETAILS[type],
}));

export const getPercussionTypeDetails = (percussionType: string): PercussionTypeDetails => (
  PERCUSSION_TYPE_DETAILS[percussionType as PercussionType]
  || PERCUSSION_TYPE_DETAILS[PERCUSSION_TYPES.GENERIC_PERCUSSION]
);

export const getPercussionTypeAbbreviation = (percussionType: string): string => (
  getPercussionTypeDetails(percussionType).abbreviation
);

export const getPercussionTypeLabel = (percussionType: string): string => (
  getPercussionTypeDetails(percussionType).label
);

export const isValidPercussionType = (percussionType: string): percussionType is PercussionType => (
  VALID_PERCUSSION_TYPES.includes(percussionType as PercussionType)
);

const COMPATIBLE_TYPES: Partial<Record<PercussionType, PercussionType[]>> = {
  [PERCUSSION_TYPES.SNARE_DRUM]: [
    PERCUSSION_TYPES.CLAP,
    PERCUSSION_TYPES.RIMSHOT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.CLAP]: [
    PERCUSSION_TYPES.SNARE_DRUM,
    PERCUSSION_TYPES.RIMSHOT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.RIMSHOT]: [
    PERCUSSION_TYPES.SNARE_DRUM,
    PERCUSSION_TYPES.CLAP,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.CLOSED_HI_HAT]: [
    PERCUSSION_TYPES.PEDAL_HI_HAT,
    PERCUSSION_TYPES.SHAKER,
    PERCUSSION_TYPES.TAMBOURINE,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.OPEN_HI_HAT]: [
    PERCUSSION_TYPES.CYMBAL,
    PERCUSSION_TYPES.CRASH_CYMBAL,
    PERCUSSION_TYPES.RIDE_CYMBAL,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.PEDAL_HI_HAT]: [
    PERCUSSION_TYPES.CLOSED_HI_HAT,
    PERCUSSION_TYPES.SHAKER,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.RIDE_CYMBAL]: [
    PERCUSSION_TYPES.CYMBAL,
    PERCUSSION_TYPES.CRASH_CYMBAL,
    PERCUSSION_TYPES.OPEN_HI_HAT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.CRASH_CYMBAL]: [
    PERCUSSION_TYPES.CYMBAL,
    PERCUSSION_TYPES.RIDE_CYMBAL,
    PERCUSSION_TYPES.OPEN_HI_HAT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.CYMBAL]: [
    PERCUSSION_TYPES.RIDE_CYMBAL,
    PERCUSSION_TYPES.CRASH_CYMBAL,
    PERCUSSION_TYPES.OPEN_HI_HAT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.TOM_HIGH]: [
    PERCUSSION_TYPES.TOM_MID,
    PERCUSSION_TYPES.TOM_LOW,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.TOM_MID]: [
    PERCUSSION_TYPES.TOM_HIGH,
    PERCUSSION_TYPES.TOM_LOW,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.TOM_LOW]: [
    PERCUSSION_TYPES.TOM_MID,
    PERCUSSION_TYPES.TOM_HIGH,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.COWBELL]: [
    PERCUSSION_TYPES.CLAVE,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.CLAVE]: [
    PERCUSSION_TYPES.COWBELL,
    PERCUSSION_TYPES.RIMSHOT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.TAMBOURINE]: [
    PERCUSSION_TYPES.SHAKER,
    PERCUSSION_TYPES.CLOSED_HI_HAT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
  [PERCUSSION_TYPES.SHAKER]: [
    PERCUSSION_TYPES.TAMBOURINE,
    PERCUSSION_TYPES.CLOSED_HI_HAT,
    PERCUSSION_TYPES.GENERIC_PERCUSSION,
  ],
};

const getLaneId = (lane: PatternLane): string => {
  if (typeof lane === 'string') {
    return lane;
  }

  return lane.laneId || lane.id || '';
};

const getChannelLaneId = (channel: KitChannelMetadata): string | undefined => (
  channel.laneId || channel.id
);

const enrichPatternLane = (
  patternLane: PatternLane,
  sourceKitChannels: KitChannelMetadata[],
): EnrichedPatternLane => {
  const laneId = getLaneId(patternLane);
  const sourceChannel = sourceKitChannels.find(channel => getChannelLaneId(channel) === laneId);
  const patternLaneDetails = typeof patternLane === 'string' ? {} : patternLane;

  return {
    ...(sourceChannel || {}),
    ...patternLaneDetails,
    id: laneId,
    laneId,
  };
};

const isCompatibleType = (sourceType?: string, targetType?: string): boolean => {
  if (!sourceType || !targetType) {
    return false;
  }

  return (
    COMPATIBLE_TYPES[sourceType as PercussionType] || []
  ).includes(targetType as PercussionType);
};

const scoreCandidate = (lane: EnrichedPatternLane, channel: TargetKitChannel): CandidateScore => {
  const laneId = lane.laneId || lane.id;
  const channelLaneId = getChannelLaneId(channel);
  const sameType = Boolean(lane.percussionType && lane.percussionType === channel.percussionType);
  const sameArticulation = Boolean(lane.articulation
    && lane.articulation === channel.articulation);
  const sameRegister = Boolean(lane.register && lane.register === channel.register);

  if (laneId && laneId === channelLaneId) {
    return {
      score: 100,
      confidence: 'high',
      reason: 'exact laneId match',
    };
  }

  if (sameType && sameArticulation && sameRegister) {
    return {
      score: 90,
      confidence: 'high',
      reason: 'exact percussionType, articulation, and register match',
    };
  }

  if (sameType && sameArticulation) {
    return {
      score: 80,
      confidence: 'high',
      reason: 'exact percussionType and articulation match',
    };
  }

  if (sameType && sameRegister) {
    return {
      score: 70,
      confidence: 'high',
      reason: 'exact percussionType and register match',
    };
  }

  if (sameType) {
    return {
      score: 60,
      confidence: 'medium',
      reason: 'exact percussionType match',
    };
  }

  if (isCompatibleType(lane.percussionType, channel.percussionType)) {
    return {
      score: 35,
      confidence: 'low',
      reason: `compatible percussionType fallback from ${lane.percussionType} to ${channel.percussionType}`,
    };
  }

  return {
    score: 0,
    confidence: 'unresolved',
    reason: 'no percussion metadata match',
  };
};

const findBestCandidate = (
  lane: EnrichedPatternLane,
  targetKitChannels: TargetKitChannel[],
  usedChannelIds: Set<string>,
): MappingCandidate | undefined => targetKitChannels
  .filter(channel => !usedChannelIds.has(channel.id))
  .map(channel => ({
    channel,
    ...scoreCandidate(lane, channel),
  }))
  .filter(candidate => candidate.score > 0)
  .sort((a, b) => b.score - a.score)[0];

export const resolveKitChannelMapping = ({
  patternLanes = [],
  sourceKitChannels = [],
  targetKitChannels = [],
}: ResolveKitChannelMappingArgs = {}): KitChannelMappingResult => {
  const usedChannelIds = new Set<string>();

  return patternLanes
    .map(patternLane => enrichPatternLane(patternLane, sourceKitChannels))
    .reduce<KitChannelMappingResult>((result, lane) => {
      const candidate = findBestCandidate(lane, targetKitChannels, usedChannelIds);
      const laneId = lane.laneId || lane.id;

      if (!candidate) {
        result.unresolved.push({
          laneId,
          source: lane,
          reason: 'no target kit channel matched this lane',
        });
        return result;
      }

      usedChannelIds.add(candidate.channel.id);
      result.mappings.push({
        laneId,
        source: lane,
        targetKitChannelId: candidate.channel.id,
        target: candidate.channel,
        confidence: candidate.confidence,
        reason: candidate.reason,
      });
      return result;
    }, {
      mappings: [],
      unresolved: [],
    });
};
