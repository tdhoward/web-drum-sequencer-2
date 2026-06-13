export const DEFAULT_SONG_ID = 'song-1';
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

export const createSongState = ({
  id = DEFAULT_SONG_ID,
  name = 'Untitled Song',
  selectedPatternIndex = 0,
  patternCount = DEFAULT_PATTERN_COUNT,
} = {}) => ({
  id,
  name,
  selectedPatternId: patternIndexToId(selectedPatternIndex),
  patternIds: createPatternIds(patternCount),
});

export const createPatternsState = ({
  patternCount = DEFAULT_PATTERN_COUNT,
  channelIds = [],
} = {}) => {
  const ids = createPatternIds(patternCount);
  return {
    ids,
    entities: ids.reduce((entities, id, index) => ({
      ...entities,
      [id]: {
        id,
        name: `Pattern ${index + 1}`,
        ...DEFAULT_PATTERN_SETTINGS,
        channelIds,
      },
    }), {}),
  };
};

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

const getLegacyPatternNotes = (legacyNotes, channelId, patternIndex) => (
  (((legacyNotes || {})[channelId] || [])[patternIndex] || [])
);

export const collectNoteIdsForChannel = (
  legacyNotes,
  channelId,
  patternIds = createPatternIds(),
) => patternIds.flatMap((patternId, patternIndex) => getLegacyPatternNotes(
  legacyNotes,
  channelId,
  patternIndex,
).map(note => note.id));

export const normalizeChannelsState = (
  channels = [],
  legacyNotes = {},
  patternIds = createPatternIds(),
) => ({
  ids: channels.map(channel => channel.id),
  entities: channels.reduce((entities, channel) => ({
    ...entities,
    [channel.id]: {
      ...channel,
      noteIds: collectNoteIdsForChannel(legacyNotes, channel.id, patternIds),
    },
  }), {}),
});

export const normalizeNotesState = (
  legacyNotes = {},
  patternIds = createPatternIds(),
  patterns = createPatternsState({ patternCount: patternIds.length }),
) => Object.entries(legacyNotes).reduce((state, [channelId, channelPatterns]) => {
  channelPatterns.forEach((patternNotes, patternIndex) => {
    const patternId = patternIds[patternIndex] || patternIndexToId(patternIndex);
    const pattern = patterns.entities[patternId] || DEFAULT_PATTERN_SETTINGS;
    patternNotes.forEach((note) => {
      state.ids.push(note.id);
      state.entities[note.id] = {
        id: note.id,
        channelId,
        patternId,
        step: beatToStep(note.beat, pattern),
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
  channelsState,
  patternsState,
}) => channelsState.ids.reduce((legacyNotes, channelId) => {
  legacyNotes[channelId] = patternsState.ids.map((patternId) => {
    const pattern = patternsState.entities[patternId] || DEFAULT_PATTERN_SETTINGS;
    return notesState.ids
      .map(noteId => notesState.entities[noteId])
      .filter(note => note.channelId === channelId && note.patternId === patternId)
      .sort((a, b) => a.step - b.step)
      .map(note => ({
        beat: stepToBeat(note.step, pattern),
        id: note.id,
      }));
  });
  return legacyNotes;
}, {});

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
  const channelIds = legacyChannels.map(channel => channel.id);
  const patternCount = Math.max(
    DEFAULT_PATTERN_COUNT,
    ...Object.values(legacyNotes || {}).map(channelNotes => channelNotes.length),
  );
  const song = state.song || createSongState({ selectedPatternIndex, patternCount });
  const patterns = state.patterns?.entities
    ? state.patterns
    : createPatternsState({ patternCount, channelIds });

  return {
    ...state,
    song,
    patterns,
    channels: Array.isArray(state.channels)
      ? normalizeChannelsState(legacyChannels, legacyNotes, patterns.ids)
      : state.channels || normalizeChannelsState(legacyChannels, legacyNotes, patterns.ids),
    notes: state.notes?.entities
      ? state.notes
      : normalizeNotesState(legacyNotes, patterns.ids, patterns),
    master: {
      selectedChannel: state.master?.selectedChannel || legacyChannels[0]?.id,
    },
  };
};
