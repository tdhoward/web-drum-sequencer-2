import presets from '../presets';
import {
  DEFAULT_KIT_ID,
  createKitsState,
  createKitChannelAssignmentsState,
  createPatternsState,
  createSamplesState,
  createSongState,
  normalizeKitChannelsState,
  normalizeNotesState,
} from './sequencerModel';
import type {
  KitChannelAssignmentsState,
  KitChannelsState,
  KitsState,
  NotesState,
  PatternsState,
  SamplesState,
  SequencerModelState,
  SongState,
} from './sequencerModel';

export const DEFAULT_PRESET = presets[1];
export const DEFAULT_KIT_NAME = DEFAULT_PRESET.name;

export const defaultLaneIds = DEFAULT_PRESET.channels.map(channel => channel.laneId || channel.id);

export const createDefaultSongState = (): SongState => createSongState({
  selectedKitId: DEFAULT_KIT_ID,
  patternCount: DEFAULT_PRESET.notes?.[defaultLaneIds[0]]?.length,
});

export const createDefaultPatternsState = (): PatternsState => createPatternsState({
  patternCount: DEFAULT_PRESET.notes?.[defaultLaneIds[0]]?.length,
  laneIds: defaultLaneIds,
});

export const createDefaultKitChannelsState = (): KitChannelsState => normalizeKitChannelsState(
  DEFAULT_PRESET.channels,
  DEFAULT_KIT_ID,
);

export const createDefaultKitsState = (): KitsState => createKitsState(
  DEFAULT_PRESET.channels,
  DEFAULT_KIT_ID,
  DEFAULT_KIT_NAME,
);

export const createDefaultSamplesState = (): SamplesState => (
  createSamplesState(DEFAULT_PRESET.channels)
);

export const createDefaultKitChannelAssignmentsState = (): KitChannelAssignmentsState => (
  createKitChannelAssignmentsState(
    DEFAULT_PRESET.channels,
    DEFAULT_KIT_ID,
  )
);

export const createDefaultNotesState = (): NotesState => normalizeNotesState(
  DEFAULT_PRESET.notes,
  createDefaultPatternsState().ids,
  createDefaultPatternsState(),
);

export const createDefaultSequencerState = (): SequencerModelState => ({
  song: createDefaultSongState(),
  patterns: createDefaultPatternsState(),
  kits: createDefaultKitsState(),
  kitChannels: createDefaultKitChannelsState(),
  kitChannelAssignments: createDefaultKitChannelAssignmentsState(),
  samples: createDefaultSamplesState(),
  notes: createDefaultNotesState(),
});
