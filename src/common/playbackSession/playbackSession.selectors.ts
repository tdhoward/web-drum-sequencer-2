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
