import { getAudioContext } from '../../services/audioContext';
import { unmute } from '../../services/unmute';
import { playbackSessionSlice } from './playbackSession.reducer';

type Dispatch = (action: unknown) => void;

export const {
  startPlayback,
  stopPlayback,
  setStartTime,
  setPlaybackMode,
  setArrangementIndex,
} = playbackSessionSlice.actions;

type PlaybackRootState = {
  playbackSession: { mode: string };
  song: { arrangementPatternIds?: Array<string | null> };
};

export const startPlaybackAndResume = () => (
  dispatch: Dispatch,
  getState: () => PlaybackRootState,
): void => {
  const state = getState();
  if (
    state.playbackSession.mode === 'song'
    && !(state.song.arrangementPatternIds || []).some(patternId => patternId !== null)
  ) {
    return;
  }
  unmute();
  getAudioContext().resume();
  dispatch(startPlayback());
};
