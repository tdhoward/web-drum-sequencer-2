import type { PlaybackSessionState } from './playbackSession.reducer';

type PlaybackSessionRootState = {
  playbackSession: PlaybackSessionState;
};

export const playingSelector = (state: PlaybackSessionRootState): boolean => (
  state.playbackSession.playing
);

export const startTimeSelector = (state: PlaybackSessionRootState): number | null => (
  state.playbackSession.startTime
);

export const playbackModeSelector = (state: PlaybackSessionRootState) => state.playbackSession.mode;

export const arrangementIndexSelector = (state: PlaybackSessionRootState): number => (
  state.playbackSession.arrangementIndex
);

export const activeBpmSelector = (state: PlaybackSessionRootState): number | null => (
  state.playbackSession.activeBpm
);

export const activeTempoColumnSelector = (state: PlaybackSessionRootState): number => (
  state.playbackSession.activeTempoColumn
);

export const songOccurrenceStartTimeSelector = (
  state: PlaybackSessionRootState,
): number | null => state.playbackSession.songOccurrenceStartTime;
