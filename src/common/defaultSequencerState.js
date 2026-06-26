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

export const DEFAULT_PRESET = presets[1];
export const DEFAULT_KIT_NAME = DEFAULT_PRESET.name;

export const defaultLaneIds = DEFAULT_PRESET.channels.map(channel => channel.laneId || channel.id);

export const createDefaultSongState = () => createSongState({
  selectedKitId: DEFAULT_KIT_ID,
  patternCount: DEFAULT_PRESET.notes?.[defaultLaneIds[0]]?.length,
});

export const createDefaultPatternsState = () => createPatternsState({
  patternCount: DEFAULT_PRESET.notes?.[defaultLaneIds[0]]?.length,
  laneIds: defaultLaneIds,
});

export const createDefaultKitChannelsState = () => normalizeKitChannelsState(
  DEFAULT_PRESET.channels,
  DEFAULT_KIT_ID,
);

export const createDefaultKitsState = () => createKitsState(
  DEFAULT_PRESET.channels,
  DEFAULT_KIT_ID,
  DEFAULT_KIT_NAME,
);

export const createDefaultSamplesState = () => createSamplesState(DEFAULT_PRESET.channels);

export const createDefaultKitChannelAssignmentsState = () => createKitChannelAssignmentsState(
  DEFAULT_PRESET.channels,
  DEFAULT_KIT_ID,
);

export const createDefaultNotesState = () => normalizeNotesState(
  DEFAULT_PRESET.notes,
  createDefaultPatternsState().ids,
  createDefaultPatternsState(),
);

export const createDefaultSequencerState = () => ({
  song: createDefaultSongState(),
  patterns: createDefaultPatternsState(),
  kits: createDefaultKitsState(),
  kitChannels: createDefaultKitChannelsState(),
  kitChannelAssignments: createDefaultKitChannelAssignmentsState(),
  samples: createDefaultSamplesState(),
  notes: createDefaultNotesState(),
});
