import { PERCUSSION_TYPES } from './percussion';

export const DEFAULT_SONG_ID = 'song-1';
export const DEFAULT_KIT_ID = 'default-kit';
export const DEFAULT_PATTERN_COUNT = 8;
export const DEFAULT_PATTERN_SETTINGS = {
  timeSignature: {
    beatsPerBar: 4,
    beatUnit: 4,
  },
  bars: 1,
  stepsPerBeat: 4,
};

export const patternIndexToId = index => `pattern-${index}`;

export const patternIdToIndex = (patternId) => {
  const index = Number(String(patternId).replace('pattern-', ''));
  return Number.isNaN(index) ? 0 : index;
};

export const createPatternIds = (patternCount = DEFAULT_PATTERN_COUNT) => (
  Array.from({ length: patternCount }, (_, index) => patternIndexToId(index))
);

export const sampleIdFromUrl = url => `sample:${url}`;

export const createSongState = ({
  id = DEFAULT_SONG_ID,
  name = 'Untitled Song',
  selectedPatternIndex = 0,
  selectedKitId = DEFAULT_KIT_ID,
  patternCount = DEFAULT_PATTERN_COUNT,
} = {}) => ({
  id,
  name,
  selectedKitId,
  selectedPatternId: patternIndexToId(selectedPatternIndex),
  patternIds: createPatternIds(patternCount),
});

const channelToLaneId = channel => channel.laneId || channel.id;

export const createPatternsState = ({
  patternCount = DEFAULT_PATTERN_COUNT,
  laneIds,
  channelIds = [],
} = {}) => {
  const ids = createPatternIds(patternCount);
  const patternLaneIds = laneIds || channelIds;
  return {
    ids,
    entities: ids.reduce((entities, id, index) => ({
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
  channels = [],
  kitId = DEFAULT_KIT_ID,
  kitName = 'Default Kit',
) => ({
  ids: [kitId],
  entities: {
    [kitId]: {
      id: kitId,
      name: kitName,
      channelIds: channels.map(channel => channel.id),
    },
  },
});

export const createSamplesState = (channels = []) => channels.reduce((state, channel) => {
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
  };
  return state;
}, { ids: [], entities: {} });

export const normalizeKitChannelsState = (
  channels = [],
  kitId = DEFAULT_KIT_ID,
) => ({
  ids: channels.map(channel => channel.id),
  entities: channels.reduce((entities, channel) => {
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
  channels = [],
  kitId = DEFAULT_KIT_ID,
) => ({
  ids: channels.map(channel => channel.id),
  entities: channels.reduce((entities, channel) => ({
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

export const getPatternLengthInQuarterBeats = ({
  timeSignature = DEFAULT_PATTERN_SETTINGS.timeSignature,
  bars = DEFAULT_PATTERN_SETTINGS.bars,
} = DEFAULT_PATTERN_SETTINGS) => (
  timeSignature.beatsPerBar * bars * (4 / timeSignature.beatUnit)
);

export const getPatternTotalSteps = ({
  timeSignature = DEFAULT_PATTERN_SETTINGS.timeSignature,
  bars = DEFAULT_PATTERN_SETTINGS.bars,
  stepsPerBeat = DEFAULT_PATTERN_SETTINGS.stepsPerBeat,
} = DEFAULT_PATTERN_SETTINGS) => timeSignature.beatsPerBar * bars * stepsPerBeat;

export const getQuarterBeatsPerStep = ({
  timeSignature = DEFAULT_PATTERN_SETTINGS.timeSignature,
  stepsPerBeat = DEFAULT_PATTERN_SETTINGS.stepsPerBeat,
} = DEFAULT_PATTERN_SETTINGS) => (4 / timeSignature.beatUnit) / stepsPerBeat;

export const beatToStep = (beat, pattern = DEFAULT_PATTERN_SETTINGS) => Math.round(
  (beat - 1) / getQuarterBeatsPerStep(pattern),
);

export const stepToBeat = (step, pattern = DEFAULT_PATTERN_SETTINGS) => (
  1 + step * getQuarterBeatsPerStep(pattern)
);

const getPatternLaneIds = patternsState => patternsState.ids.reduce((laneIds, patternId) => {
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
}, []);

export const normalizeNotesState = (
  legacyNotes = {},
  patternIds = createPatternIds(),
  patterns = createPatternsState({ patternCount: patternIds.length }),
) => Object.entries(legacyNotes).reduce((state, [laneId, lanePatterns]) => {
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
        velocity: typeof note.velocity === 'undefined' ? 1 : note.velocity,
      };
    });
  });
  return state;
}, { ids: [], entities: {} });

export const emptyLegacyNotesForPatternCount = (patternCount = DEFAULT_PATTERN_COUNT) => (
  Array.from({ length: patternCount }, () => [])
);

export const notesStateToLegacyNotes = ({
  notesState,
  patternsState,
  laneIds,
}) => {
  const allLaneIds = laneIds || getPatternLaneIds(patternsState);
  return allLaneIds.reduce((legacyNotes, laneId) => {
    legacyNotes[laneId] = patternsState.ids.map((patternId) => {
      const pattern = patternsState.entities[patternId] || DEFAULT_PATTERN_SETTINGS;
      return notesState.ids
        .map(noteId => notesState.entities[noteId])
        .filter(note => note.laneId === laneId && note.patternId === patternId)
        .sort((a, b) => a.step - b.step)
        .map(note => ({
          beat: stepToBeat(note.step, pattern),
          id: note.id,
        }));
    });
    return legacyNotes;
  }, {});
};

const normalizeExistingNotesStateToLanes = (notesState = {}) => ({
  ids: notesState.ids || [],
  entities: (notesState.ids || []).reduce((entities, noteId) => {
    const note = notesState.entities[noteId];
    entities[noteId] = {
      ...note,
      laneId: note.laneId || note.channelId,
    };
    delete entities[noteId].channelId;
    return entities;
  }, {}),
});

const migratePatternsToLanes = (patternsState, laneIds) => ({
  ids: patternsState.ids,
  entities: patternsState.ids.reduce((entities, patternId) => {
    const pattern = patternsState.entities[patternId];
    entities[patternId] = {
      ...pattern,
      laneIds: pattern.laneIds || pattern.channelIds || laneIds,
    };
    delete entities[patternId].channelIds;
    return entities;
  }, {}),
});

export const migrateToNormalizedSequencerState = (state = {}, fallbackPreset) => {
  const legacyChannels = Array.isArray(state.channels)
    ? state.channels
    : fallbackPreset.channels;
  const legacyNotes = state.notes && !Array.isArray(state.notes.ids)
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
  const song = state.song || createSongState({ selectedPatternIndex, patternCount });
  const patterns = state.patterns?.entities
    ? migratePatternsToLanes(state.patterns, laneIds)
    : createPatternsState({ patternCount, laneIds });

  return {
    ...state,
    song,
    patterns,
    channels: Array.isArray(state.channels)
      ? normalizeKitChannelsState(legacyChannels)
      : state.channels || normalizeKitChannelsState(legacyChannels),
    notes: state.notes?.entities
      ? normalizeExistingNotesStateToLanes(state.notes)
      : normalizeNotesState(legacyNotes, patterns.ids, patterns),
    master: {
      selectedChannel: state.master?.selectedChannel || legacyChannels[0]?.id,
    },
  };
};

export const migrateToKitSequencerState = (state = {}, fallbackPreset) => {
  const normalizedState = migrateToNormalizedSequencerState(state, fallbackPreset);
  const { channels: legacyChannelsState, ...stateWithoutLegacyChannels } = normalizedState;
  const existingChannelsState = normalizedState.kitChannels || legacyChannelsState;
  const channels = existingChannelsState?.ids
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
