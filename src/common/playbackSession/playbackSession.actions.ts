import { getAudioContext } from '../../services/audioContext';
import { unmute } from '../../services/unmute';
import { playbackSessionSlice } from './playbackSession.reducer';

type Dispatch = (action: unknown) => void;

export const {
  startPlayback,
  stopPlayback,
  setStartTime,
} = playbackSessionSlice.actions;

export const startPlaybackAndResume = () => (dispatch: Dispatch): void => {
  unmute();
  getAudioContext().resume();
  dispatch(startPlayback());
};
