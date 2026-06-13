const hasEntity = (collection, id) => Boolean(id && collection?.entities?.[id]);

const getKitChannelLaneIds = (kit, kitChannels) => (
  kit?.channelIds || []
).reduce((laneIds, channelId) => {
  const kitChannel = kitChannels?.entities?.[channelId];
  if (kitChannel?.laneId && !laneIds.includes(kitChannel.laneId)) {
    laneIds.push(kitChannel.laneId);
  }
  return laneIds;
}, []);

const addError = (errors, message) => {
  errors.push(message);
};

export const validateSequencerModelState = (state = {}) => {
  const errors = [];
  const {
    song,
    kits,
    kitChannels,
    samples,
    patterns,
    notes,
  } = state;

  if (!song) {
    addError(errors, 'song slice is missing');
    return errors;
  }

  const selectedKit = kits?.entities?.[song.selectedKitId];
  if (!selectedKit) {
    addError(errors, `song.selectedKitId does not exist: ${song.selectedKitId}`);
  }

  if (!hasEntity(patterns, song.selectedPatternId)) {
    addError(errors, `song.selectedPatternId does not exist: ${song.selectedPatternId}`);
  }

  (song.patternIds || []).forEach((patternId) => {
    if (!hasEntity(patterns, patternId)) {
      addError(errors, `song.patternIds contains missing patternId: ${patternId}`);
    }
  });

  (kits?.ids || []).forEach((kitId) => {
    const kit = kits.entities[kitId];
    (kit.channelIds || []).forEach((channelId) => {
      if (!hasEntity(kitChannels, channelId)) {
        addError(errors, `kit ${kitId} references missing kitChannelId: ${channelId}`);
      }
    });
  });

  (kitChannels?.ids || []).forEach((channelId) => {
    const kitChannel = kitChannels.entities[channelId];
    if (!hasEntity(kits, kitChannel.kitId)) {
      addError(errors, `kitChannel ${channelId} references missing kitId: ${kitChannel.kitId}`);
    }
    if (!kits?.entities?.[kitChannel.kitId]?.channelIds?.includes(channelId)) {
      addError(errors, `kitChannel ${channelId} is not listed by kit ${kitChannel.kitId}`);
    }
    if (!hasEntity(samples, kitChannel.sampleId)) {
      addError(errors, `kitChannel ${channelId} references missing sampleId: ${kitChannel.sampleId}`);
    }
  });

  const selectedKitLaneIds = getKitChannelLaneIds(selectedKit, kitChannels);
  (song.patternIds || []).forEach((patternId) => {
    const pattern = patterns?.entities?.[patternId];
    if (!pattern) {
      return;
    }
    (pattern.laneIds || []).forEach((laneId) => {
      if (!selectedKitLaneIds.includes(laneId)) {
        addError(errors, `pattern ${patternId} laneId has no selected-kit channel: ${laneId}`);
      }
    });
  });

  (notes?.ids || []).forEach((noteId) => {
    const note = notes.entities[noteId];
    const pattern = patterns?.entities?.[note.patternId];
    if (!pattern) {
      addError(errors, `note ${noteId} references missing patternId: ${note.patternId}`);
      return;
    }
    if (!(pattern.laneIds || []).includes(note.laneId)) {
      addError(errors, `note ${noteId} references laneId not used by pattern ${note.patternId}: ${note.laneId}`);
    }
  });

  return errors;
};

export const isSequencerModelStateValid = state => validateSequencerModelState(state).length === 0;
