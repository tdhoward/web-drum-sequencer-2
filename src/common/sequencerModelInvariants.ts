import { isValidPercussionType } from './percussion';
import type {
  EntityState,
  Kit,
  KitChannelAssignmentsState,
  KitChannelsState,
  KitsState,
  NotesState,
  PatternsState,
  SamplesState,
  SequencerModelState,
} from './sequencerModel';

const hasEntity = <TEntity>(
  collection: EntityState<TEntity> | undefined,
  id?: string,
): boolean => Boolean(id && collection?.entities?.[id]);

const getKitChannelLaneIds = (
  kit: Kit | undefined,
  kitChannels: KitChannelsState | undefined,
): string[] => (
  kit?.channelIds || []
).reduce<string[]>((laneIds, channelId) => {
  const kitChannel = kitChannels?.entities?.[channelId];
  if (kitChannel?.laneId && !laneIds.includes(kitChannel.laneId)) {
    laneIds.push(kitChannel.laneId);
  }
  return laneIds;
}, []);

const getKitAssignmentLaneIds = (
  kit: Kit | undefined,
  kitChannelAssignments: KitChannelAssignmentsState | undefined,
): string[] => (
  kitChannelAssignments?.ids || []
).reduce<string[]>((laneIds, assignmentId) => {
  const assignment = kitChannelAssignments?.entities[assignmentId];
  if (
    assignment
    && assignment.kitId === kit?.id
    && assignment.laneId
    && !laneIds.includes(assignment.laneId)
  ) {
    laneIds.push(assignment.laneId);
  }
  return laneIds;
}, []);

const addError = (errors: string[], message: string): void => {
  errors.push(message);
};

type SequencerModelStateInput = Partial<SequencerModelState> & {
  kits?: KitsState;
  kitChannels?: KitChannelsState;
  kitChannelAssignments?: KitChannelAssignmentsState;
  samples?: SamplesState;
  patterns?: PatternsState;
  notes?: NotesState;
};

export const validateSequencerModelState = (state: SequencerModelStateInput = {}): string[] => {
  const errors: string[] = [];
  const {
    song,
    kits,
    kitChannels,
    kitChannelAssignments,
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

  (song.arrangementPatternIds || []).forEach((patternIds) => {
    patternIds.forEach((patternId) => {
      if (!hasEntity(patterns, patternId)) {
        addError(errors, `song.arrangementPatternIds contains missing patternId: ${patternId}`);
      }
    });
  });

  (kits?.ids || []).forEach((kitId) => {
    const kit = kits?.entities[kitId];
    (kit?.channelIds || []).forEach((channelId) => {
      if (!hasEntity(kitChannels, channelId)) {
        addError(errors, `kit ${kitId} references missing kitChannelId: ${channelId}`);
      }
    });
  });

  (kitChannels?.ids || []).forEach((channelId) => {
    const kitChannel = kitChannels?.entities[channelId];
    if (!kitChannel) {
      return;
    }
    if (!hasEntity(kits, kitChannel.kitId)) {
      addError(errors, `kitChannel ${channelId} references missing kitId: ${kitChannel.kitId}`);
    }
    if (!kits?.entities?.[kitChannel.kitId]?.channelIds?.includes(channelId)) {
      addError(errors, `kitChannel ${channelId} is not listed by kit ${kitChannel.kitId}`);
    }
    if (!hasEntity(samples, kitChannel.sampleId)) {
      addError(errors, `kitChannel ${channelId} references missing sampleId: ${kitChannel.sampleId}`);
    }
    if (!isValidPercussionType(kitChannel.percussionType)) {
      addError(errors, `kitChannel ${channelId} has invalid percussionType: ${kitChannel.percussionType}`);
    }
    if (kitChannel.tags && !Array.isArray(kitChannel.tags)) {
      addError(errors, `kitChannel ${channelId} tags must be an array`);
    }
  });

  (kitChannelAssignments?.ids || []).forEach((assignmentId) => {
    const assignment = kitChannelAssignments?.entities[assignmentId];
    if (!assignment) {
      return;
    }
    if (!hasEntity(kits, assignment.kitId)) {
      addError(errors, `kitChannelAssignment ${assignmentId} references missing kitId: ${assignment.kitId}`);
    }
    if (!hasEntity(kitChannels, assignment.kitChannelId)) {
      addError(errors, `kitChannelAssignment ${assignmentId} references missing kitChannelId: ${assignment.kitChannelId}`);
      return;
    }
    if (kitChannels?.entities[assignment.kitChannelId].kitId !== assignment.kitId) {
      addError(errors, `kitChannelAssignment ${assignmentId} kitId does not match kitChannel ${assignment.kitChannelId}`);
    }
    if (!assignment.laneId) {
      addError(errors, `kitChannelAssignment ${assignmentId} is missing laneId`);
    }
  });

  const selectedKitLaneIds = getKitChannelLaneIds(selectedKit, kitChannels);
  const selectedKitAssignmentLaneIds = getKitAssignmentLaneIds(selectedKit, kitChannelAssignments);
  const selectedPlayableLaneIds = selectedKitAssignmentLaneIds.length
    ? selectedKitAssignmentLaneIds
    : selectedKitLaneIds;
  (song.patternIds || []).forEach((patternId) => {
    const pattern = patterns?.entities?.[patternId];
    if (!pattern) {
      return;
    }
    (pattern.laneIds || []).forEach((laneId) => {
      if (!selectedPlayableLaneIds.includes(laneId)) {
        addError(errors, `pattern ${patternId} laneId has no selected-kit channel: ${laneId}`);
      }
    });
  });

  (notes?.ids || []).forEach((noteId) => {
    const note = notes?.entities[noteId];
    if (!note) {
      return;
    }
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

export const isSequencerModelStateValid = (state: SequencerModelStateInput): boolean => (
  validateSequencerModelState(state).length === 0
);
