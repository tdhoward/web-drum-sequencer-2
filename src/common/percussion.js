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
};

export const VALID_PERCUSSION_TYPES = Object.values(PERCUSSION_TYPES);

export const PERCUSSION_TYPE_DETAILS = {
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

export const PERCUSSION_TYPE_OPTIONS = VALID_PERCUSSION_TYPES.map(type => ({
  type,
  ...PERCUSSION_TYPE_DETAILS[type],
}));

export const getPercussionTypeDetails = percussionType => (
  PERCUSSION_TYPE_DETAILS[percussionType]
  || PERCUSSION_TYPE_DETAILS[PERCUSSION_TYPES.GENERIC_PERCUSSION]
);

export const getPercussionTypeAbbreviation = percussionType => (
  getPercussionTypeDetails(percussionType).abbreviation
);

export const getPercussionTypeLabel = percussionType => (
  getPercussionTypeDetails(percussionType).label
);

const COMPATIBLE_TYPES = {
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

const getLaneId = lane => lane?.laneId || lane?.id || lane;

const getChannelLaneId = channel => channel?.laneId || channel?.id;

const enrichPatternLane = (patternLane, sourceKitChannels) => {
  const laneId = getLaneId(patternLane);
  const sourceChannel = sourceKitChannels.find(channel => getChannelLaneId(channel) === laneId);
  return {
    ...sourceChannel,
    ...(typeof patternLane === 'string' ? {} : patternLane),
    id: laneId,
    laneId,
  };
};

const isCompatibleType = (sourceType, targetType) => (
  COMPATIBLE_TYPES[sourceType] || []
).includes(targetType);

const scoreCandidate = (lane, channel) => {
  const laneId = lane.laneId || lane.id;
  const channelLaneId = getChannelLaneId(channel);
  const sameType = lane.percussionType && lane.percussionType === channel.percussionType;
  const sameArticulation = lane.articulation
    && lane.articulation === channel.articulation;
  const sameRegister = lane.register && lane.register === channel.register;

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

const findBestCandidate = (lane, targetKitChannels, usedChannelIds) => targetKitChannels
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
} = {}) => {
  const usedChannelIds = new Set();

  return patternLanes
    .map(patternLane => enrichPatternLane(patternLane, sourceKitChannels))
    .reduce((result, lane) => {
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
