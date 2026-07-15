import { PERCUSSION_TYPES } from './percussion';

export const DEFAULT_SONG_ID = 'song-1';
export const DEFAULT_KIT_ID = 'default-kit';
export const DEFAULT_PATTERN_COUNT = 8;
export const DEFAULT_NOTE_VELOCITY = 1;
export const MIN_NOTE_VELOCITY = 0;
export const MAX_NOTE_VELOCITY = 2;

export type EntityState<TEntity> = {
  ids: string[];
  entities: Record<string, TEntity>;
};

export type ContentHashMetadata = {
  contentHashAlgorithm: 'sha256';
  contentHashVersion: number;
  contentHash: string;
};

export type TimeSignature = {
  beatsPerBar: number;
  beatUnit: number;
};

export type PatternSettings = {
  timeSignature: TimeSignature;
  bars: number;
  stepsPerBeat: number;
};

export type Pattern = PatternSettings & {
  id: string;
  name: string;
  laneIds: string[];
  channelIds?: string[];
};

export type PatternsState = EntityState<Pattern>;

export type SongState = {
  id: string;
  name: string;
  selectedKitId: string;
  selectedPatternId: string;
  patternIds: string[];
  patternPackId?: string;
  arrangementPatternIds?: string[][];
  tempoChanges?: Array<number | null>;
};

export type SavedSong = {
  id: string;
  name: string;
  selectedKitId: string;
  patternPackId: string;
  arrangementPatternIds: string[][];
  tempoChanges?: Array<number | null>;
  kitContentHash?: string;
  patternPackContentHash?: string;
} & Partial<ContentHashMetadata>;

const isValidBpm = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0
);

export const normalizeTempoChanges = (
  value: unknown,
  columnCount: number,
  fallbackBpm: number,
): Array<number | null> => {
  const normalized = Array.from({ length: columnCount }, (_, index) => {
    if (!Array.isArray(value)) return null;
    return isValidBpm(value[index]) ? value[index] : null;
  });

  if (normalized.length > 0 && normalized[0] === null) {
    normalized[0] = isValidBpm(fallbackBpm) ? fallbackBpm : 120;
  }

  return normalized;
};

export const getEffectiveSongBpm = (
  tempoChanges: Array<number | null> | undefined,
  columnIndex: number,
  fallbackBpm: number,
): number => {
  for (let index = Math.min(columnIndex, (tempoChanges?.length || 0) - 1); index >= 0; index -= 1) {
    const bpm = tempoChanges?.[index];
    if (isValidBpm(bpm)) return bpm;
  }
  return isValidBpm(fallbackBpm) ? fallbackBpm : 120;
};

export const getEffectiveSongTempoColumn = (
  tempoChanges: Array<number | null> | undefined,
  columnIndex: number,
): number => {
  for (let index = Math.min(columnIndex, (tempoChanges?.length || 0) - 1); index >= 0; index -= 1) {
    if (isValidBpm(tempoChanges?.[index])) return index;
  }
  return 0;
};

export const normalizeArrangementPatternIds = (value: unknown): string[][] => (
  Array.isArray(value)
    ? value.map((column) => {
      const patternIds = Array.isArray(column) ? column : [column];
      return patternIds.reduce<string[]>((normalized, patternId) => {
        if (typeof patternId === 'string' && !normalized.includes(patternId)) {
          normalized.push(patternId);
        }
        return normalized;
      }, []);
    })
    : []
);

export type Kit = {
  id: string;
  name: string;
  channelIds: string[];
} & Partial<ContentHashMetadata>;

export type KitsState = EntityState<Kit>;

export type KitChannelInput = {
  id: string;
  sample?: string;
  sampleId?: string;
  kitId?: string;
  laneId?: string;
  name?: string;
  sourceType?: string;
  fileName?: string;
  percussionType?: string;
  assignmentConfidence?: string;
  [key: string]: unknown;
};

export type KitChannel = KitChannelInput & {
  kitId: string;
  laneId: string;
  sampleId: string;
  percussionType: string;
};

export type KitChannelsState = EntityState<KitChannel>;

export type KitChannelAssignment = {
  id: string;
  kitId: string;
  laneId: string;
  kitChannelId: string;
  confidence: string;
  reason?: string;
};

export type KitChannelAssignmentsState = EntityState<KitChannelAssignment>;

export type Sample = {
  id: string;
  name?: string;
  url?: string;
  sourceType: string;
  fileName?: string;
  alignmentOffset?: number;
  byteLength?: number;
} & Partial<ContentHashMetadata>;

export type SamplesState = EntityState<Sample>;

export type Note = {
  id: string;
  laneId: string;
  patternId: string;
  step: number;
  pitch: number;
  velocity: number;
};

export type NotesState = EntityState<Note>;

export type LegacyNote = {
  id: string;
  beat: number;
  step?: number;
  pitch?: number;
  velocity?: number;
};

export type LegacyNotes = Record<string, LegacyNote[][]>;

export type PatternPackLane = KitChannelInput & {
  id: string;
  laneId?: string;
};

export type PatternPack = {
  id: string;
  name: string;
  bpm: number;
  swing: number;
  patternNames?: string[];
  patternSettings?: PatternSettings[];
  lanes: PatternPackLane[];
  notes: LegacyNotes;
} & Partial<ContentHashMetadata>;

export type SequencerModelState = {
  song: SongState;
  patterns: PatternsState;
  kits: KitsState;
  kitChannels: KitChannelsState;
  kitChannelAssignments: KitChannelAssignmentsState;
  samples: SamplesState;
  notes: NotesState;
};

export type SequencerRootState = Partial<SequencerModelState> & {
  channels?: KitChannelsState;
  [key: string]: unknown;
};

export type LegacyPreset = {
  channels: KitChannelInput[];
  notes: LegacyNotes;
};

export type FactoryPresetChannel = KitChannelInput & {
  sample: string;
};

export type FactoryPreset = LegacyPreset & {
  name: string;
  bpm: number;
  swing: number;
  channels: FactoryPresetChannel[];
};

export type LegacySequencerState = Partial<SequencerModelState> & {
  channels?: KitChannelInput[] | KitChannelsState;
  notes?: LegacyNotes | NotesState;
  master?: {
    pattern?: number;
    selectedChannel?: string;
  };
  [key: string]: unknown;
};

export const DEFAULT_PATTERN_SETTINGS: PatternSettings = {
  timeSignature: {
    beatsPerBar: 4,
    beatUnit: 4,
  },
  bars: 1,
  stepsPerBeat: 4,
};

type PatternSettingsInput = Partial<PatternSettings> | undefined;

const positiveNumberOrDefault = (value: unknown, fallback: number): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
);

export const normalizePatternSettings = (
  settings: PatternSettingsInput = DEFAULT_PATTERN_SETTINGS,
): PatternSettings => ({
  timeSignature: {
    beatsPerBar: positiveNumberOrDefault(
      settings?.timeSignature?.beatsPerBar,
      DEFAULT_PATTERN_SETTINGS.timeSignature.beatsPerBar,
    ),
    beatUnit: positiveNumberOrDefault(
      settings?.timeSignature?.beatUnit,
      DEFAULT_PATTERN_SETTINGS.timeSignature.beatUnit,
    ),
  },
  bars: positiveNumberOrDefault(settings?.bars, DEFAULT_PATTERN_SETTINGS.bars),
  stepsPerBeat: positiveNumberOrDefault(
    settings?.stepsPerBeat,
    DEFAULT_PATTERN_SETTINGS.stepsPerBeat,
  ),
});

export const patternIndexToId = (index: number): string => `pattern-${index}`;

export const patternIdToIndex = (patternId: string): number => {
  const index = Number(String(patternId).replace('pattern-', ''));
  return Number.isNaN(index) ? 0 : index;
};

export const createPatternIds = (patternCount = DEFAULT_PATTERN_COUNT): string[] => (
  Array.from({ length: patternCount }, (_, index) => patternIndexToId(index))
);

export const sampleIdFromUrl = (url?: string): string => `sample:${url}`;

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

export const normalizeNoteVelocity = (velocity: unknown = DEFAULT_NOTE_VELOCITY): number => (
  typeof velocity === 'number' && Number.isFinite(velocity)
    ? clamp(velocity, MIN_NOTE_VELOCITY, MAX_NOTE_VELOCITY)
    : DEFAULT_NOTE_VELOCITY
);

type CreateSongStateArgs = {
  id?: string;
  name?: string;
  selectedPatternIndex?: number;
  selectedKitId?: string;
  patternCount?: number;
};

export const createSongState = ({
  id = DEFAULT_SONG_ID,
  name = 'Untitled Song',
  selectedPatternIndex = 0,
  selectedKitId = DEFAULT_KIT_ID,
  patternCount = DEFAULT_PATTERN_COUNT,
}: CreateSongStateArgs = {}): SongState => ({
  id,
  name,
  selectedKitId,
  selectedPatternId: patternIndexToId(selectedPatternIndex),
  patternIds: createPatternIds(patternCount),
  arrangementPatternIds: [],
  tempoChanges: [],
});

const channelToLaneId = (channel: { id: string; laneId?: string }): string => (
  channel.laneId || channel.id
);

type CreatePatternsStateArgs = {
  patternCount?: number;
  laneIds?: string[];
  channelIds?: string[];
};

export const createPatternsState = ({
  patternCount = DEFAULT_PATTERN_COUNT,
  laneIds,
  channelIds = [],
}: CreatePatternsStateArgs = {}): PatternsState => {
  const ids = createPatternIds(patternCount);
  const patternLaneIds = laneIds || channelIds;
  return {
    ids,
    entities: ids.reduce<Record<string, Pattern>>((entities, id, index) => ({
      ...entities,
      [id]: {
        id,
        name: `Pattern ${index + 1}`,
        ...DEFAULT_PATTERN_SETTINGS,
        laneIds: patternLaneIds,
      },
    }), {}),
  };
};

export const createKitsState = (
  channels: KitChannelInput[] = [],
  kitId = DEFAULT_KIT_ID,
  kitName = 'Default Kit',
): KitsState => ({
  ids: [kitId],
  entities: {
    [kitId]: {
      id: kitId,
      name: kitName,
      channelIds: channels.map(channel => channel.id),
    },
  },
});

export const createSamplesState = (channels: KitChannelInput[] = []): SamplesState => (
  channels.reduce<SamplesState>((state, channel) => {
    const sampleUrl = channel.sample;
    const sampleId = channel.sampleId || sampleIdFromUrl(sampleUrl);
    if (!state.entities[sampleId]) {
      state.ids.push(sampleId);
    }
    state.entities[sampleId] = {
      id: sampleId,
      name: channel.name || sampleUrl,
      url: sampleUrl,
      sourceType: channel.sourceType || 'factory',
      fileName: channel.fileName || undefined,
      alignmentOffset: typeof channel.alignmentOffset === 'number'
        && Number.isFinite(channel.alignmentOffset)
        ? Math.max(0, channel.alignmentOffset)
        : 0,
    };
    return state;
  }, { ids: [], entities: {} })
);

export const normalizeKitChannelsState = (
  channels: KitChannelInput[] = [],
  kitId = DEFAULT_KIT_ID,
): KitChannelsState => ({
  ids: channels.map(channel => channel.id),
  entities: channels.reduce<Record<string, KitChannel>>((entities, channel) => {
    const sampleUrl = channel.sample;
    const laneId = channelToLaneId(channel);
    return {
      ...entities,
      [channel.id]: {
        ...channel,
        kitId: channel.kitId || kitId,
        laneId,
        percussionType: channel.percussionType || PERCUSSION_TYPES.GENERIC_PERCUSSION,
        sampleId: channel.sampleId || sampleIdFromUrl(sampleUrl),
      },
    };
  }, {}),
});

export const normalizeChannelsState = normalizeKitChannelsState;

export const createKitChannelAssignmentsState = (
  channels: KitChannelInput[] = [],
  kitId = DEFAULT_KIT_ID,
): KitChannelAssignmentsState => ({
  ids: channels.map(channel => channel.id),
  entities: channels.reduce<Record<string, KitChannelAssignment>>((entities, channel) => ({
    ...entities,
    [channel.id]: {
      id: channel.id,
      kitId: channel.kitId || kitId,
      laneId: channelToLaneId(channel),
      kitChannelId: channel.id,
      confidence: channel.assignmentConfidence || 'manual',
    },
  }), {}),
});

export const getPatternLengthInQuarterBeats = (
  settings: PatternSettingsInput = DEFAULT_PATTERN_SETTINGS,
): number => {
  const { timeSignature, bars } = normalizePatternSettings(settings);
  return timeSignature.beatsPerBar * bars * (4 / timeSignature.beatUnit);
};

export const getBarLengthInQuarterBeats = (
  settings: PatternSettingsInput = DEFAULT_PATTERN_SETTINGS,
): number => {
  const { timeSignature } = normalizePatternSettings(settings);
  return timeSignature.beatsPerBar * (4 / timeSignature.beatUnit);
};

export const getPatternTotalSteps = (
  settings: PatternSettingsInput = DEFAULT_PATTERN_SETTINGS,
): number => {
  const {
    timeSignature,
    bars,
    stepsPerBeat,
  } = normalizePatternSettings(settings);
  return timeSignature.beatsPerBar * bars * stepsPerBeat;
};

export const getQuarterBeatsPerStep = (
  settings: PatternSettingsInput = DEFAULT_PATTERN_SETTINGS,
): number => {
  const { timeSignature, stepsPerBeat } = normalizePatternSettings(settings);
  return (4 / timeSignature.beatUnit) / stepsPerBeat;
};

export const beatToStep = (
  beat: number,
  pattern: PatternSettingsInput = DEFAULT_PATTERN_SETTINGS,
): number => Math.round(
  (beat - 1) / getQuarterBeatsPerStep(pattern),
);

export const stepToBeat = (
  step: number,
  pattern: PatternSettingsInput = DEFAULT_PATTERN_SETTINGS,
): number => (
  1 + step * getQuarterBeatsPerStep(pattern)
);

const getPatternLaneIds = (patternsState: PatternsState): string[] => (
  patternsState.ids.reduce<string[]>((laneIds, patternId) => {
    const pattern = patternsState.entities[patternId];
    if (!pattern) {
      return laneIds;
    }
    (pattern.laneIds || pattern.channelIds || []).forEach((laneId) => {
      if (!laneIds.includes(laneId)) {
        laneIds.push(laneId);
      }
    });
    return laneIds;
  }, [])
);

export const normalizeNotesState = (
  legacyNotes: LegacyNotes = {},
  patternIds: string[] = createPatternIds(),
  patterns: PatternsState = createPatternsState({ patternCount: patternIds.length }),
): NotesState => (
  Object.entries(legacyNotes).reduce<NotesState>((state, [laneId, lanePatterns]) => {
    lanePatterns.forEach((patternNotes, patternIndex) => {
      const patternId = patternIds[patternIndex] || patternIndexToId(patternIndex);
      const pattern = patterns.entities[patternId] || DEFAULT_PATTERN_SETTINGS;
      patternNotes.forEach((note) => {
        state.ids.push(note.id);
        state.entities[note.id] = {
          id: note.id,
          laneId,
          patternId,
          step: typeof note.step === 'undefined' ? beatToStep(note.beat, pattern) : note.step,
          pitch: note.pitch || 0,
          velocity: normalizeNoteVelocity(note.velocity),
        };
      });
    });
    return state;
  }, { ids: [], entities: {} })
);

export const emptyLegacyNotesForPatternCount = (patternCount = DEFAULT_PATTERN_COUNT): LegacyNote[][] => (
  Array.from({ length: patternCount }, () => [])
);

type NotesStateToLegacyNotesArgs = {
  notesState: NotesState;
  patternsState: PatternsState;
  laneIds?: string[];
};

export const notesStateToLegacyNotes = ({
  notesState,
  patternsState,
  laneIds,
}: NotesStateToLegacyNotesArgs): LegacyNotes => {
  const allLaneIds = laneIds || getPatternLaneIds(patternsState);
  return allLaneIds.reduce<LegacyNotes>((legacyNotes, laneId) => {
    legacyNotes[laneId] = patternsState.ids.map((patternId) => {
      const pattern = patternsState.entities[patternId] || DEFAULT_PATTERN_SETTINGS;
      return notesState.ids
        .map(noteId => notesState.entities[noteId])
        .filter(note => note.laneId === laneId && note.patternId === patternId)
        .sort((a, b) => a.step - b.step)
        .map((note) => {
          const legacyNote: LegacyNote = {
            beat: stepToBeat(note.step, pattern),
            id: note.id,
          };

          if (note.pitch !== 0) {
            legacyNote.pitch = note.pitch;
          }
          if (note.velocity !== 1) {
            legacyNote.velocity = note.velocity;
          }

          return legacyNote;
        });
    });
    return legacyNotes;
  }, {});
};

const isEntityState = <TEntity>(value: unknown): value is EntityState<TEntity> => (
  Boolean(
    value
      && typeof value === 'object'
      && Array.isArray((value as EntityState<TEntity>).ids)
      && typeof (value as EntityState<TEntity>).entities === 'object',
  )
);

const isPatternsState = (value: unknown): value is PatternsState => isEntityState<Pattern>(value);

const isNotesState = (value: unknown): value is NotesState => isEntityState<Note>(value);

const isKitChannelsState = (value: unknown): value is KitChannelsState => (
  isEntityState<KitChannel>(value)
);

const normalizeExistingNotesStateToLanes = (notesState: Partial<NotesState> = {}): NotesState => ({
  ids: notesState.ids || [],
  entities: (notesState.ids || []).reduce<Record<string, Note>>((entities, noteId) => {
    const note = notesState.entities?.[noteId];
    if (!note) {
      return entities;
    }

    const normalizedNote = {
      ...note,
      laneId: note.laneId || (note as Note & { channelId?: string }).channelId || '',
      velocity: normalizeNoteVelocity(note.velocity),
    };
    delete (normalizedNote as Note & { channelId?: string }).channelId;

    entities[noteId] = normalizedNote;
    return entities;
  }, {}),
});

const migratePatternsToLanes = (patternsState: PatternsState, laneIds: string[]): PatternsState => ({
  ids: patternsState.ids,
  entities: patternsState.ids.reduce<Record<string, Pattern>>((entities, patternId) => {
    const pattern = patternsState.entities[patternId];
    entities[patternId] = {
      ...pattern,
      ...normalizePatternSettings(pattern),
      laneIds: pattern.laneIds || pattern.channelIds || laneIds,
    };
    delete entities[patternId].channelIds;
    return entities;
  }, {}),
});

export const migrateToNormalizedSequencerState = (
  state: LegacySequencerState = {},
  fallbackPreset: LegacyPreset,
) => {
  const legacyChannels = Array.isArray(state.channels)
    ? state.channels
    : fallbackPreset.channels;
  const legacyNotes = state.notes && !isNotesState(state.notes)
    ? state.notes
    : fallbackPreset.notes;
  const selectedPatternIndex = typeof state.master?.pattern === 'number'
    ? state.master.pattern
    : 0;
  const laneIds = legacyChannels.map(channelToLaneId);
  const patternCount = Math.max(
    DEFAULT_PATTERN_COUNT,
    ...Object.values(legacyNotes || {}).map(channelNotes => channelNotes.length),
  );
  const existingSong = state.song;
  const song = existingSong
    ? {
      ...existingSong,
      arrangementPatternIds: normalizeArrangementPatternIds(existingSong.arrangementPatternIds),
    }
    : createSongState({ selectedPatternIndex, patternCount });
  const patterns = isPatternsState(state.patterns)
    ? migratePatternsToLanes(state.patterns, laneIds)
    : createPatternsState({ patternCount, laneIds });

  return {
    ...state,
    song,
    patterns,
    channels: Array.isArray(state.channels)
      ? normalizeKitChannelsState(legacyChannels)
      : state.channels || normalizeKitChannelsState(legacyChannels),
    notes: isNotesState(state.notes)
      ? normalizeExistingNotesStateToLanes(state.notes)
      : normalizeNotesState(legacyNotes, patterns.ids, patterns),
    master: {
      selectedChannel: state.master?.selectedChannel || legacyChannels[0]?.id,
    },
  };
};

export const migrateToKitSequencerState = (
  state: LegacySequencerState = {},
  fallbackPreset: LegacyPreset,
) => {
  const normalizedState = migrateToNormalizedSequencerState(state, fallbackPreset);
  const { channels: legacyChannelsState, ...stateWithoutLegacyChannels } = normalizedState;
  const existingChannelsState = normalizedState.kitChannels || legacyChannelsState;
  const channels = isKitChannelsState(existingChannelsState)
    ? existingChannelsState.ids.map(id => existingChannelsState.entities[id])
    : fallbackPreset.channels;
  const kitId = normalizedState.song?.selectedKitId || DEFAULT_KIT_ID;
  const song = {
    ...normalizedState.song,
    selectedKitId: kitId,
  };
  const patterns = migratePatternsToLanes(
    normalizedState.patterns,
    channels.map(channelToLaneId),
  );

  return {
    ...stateWithoutLegacyChannels,
    song,
    patterns,
    kits: normalizedState.kits || createKitsState(channels, kitId),
    kitChannels: normalizedState.kitChannels || normalizeKitChannelsState(channels, kitId),
    kitChannelAssignments: normalizedState.kitChannelAssignments
      || createKitChannelAssignmentsState(channels, kitId),
    samples: normalizedState.samples || createSamplesState(channels),
    notes: normalizeExistingNotesStateToLanes(normalizedState.notes),
  };
};
