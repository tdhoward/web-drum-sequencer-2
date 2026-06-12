import { getAudioContext } from '../../services/audioContext';
import { unmute } from '../../services/unmute';
import { playbackSessionSlice } from './playbackSession.reducer';

export const {
  startPlayback,
  stopPlayback,
  setStartTime,
} = playbackSessionSlice.actions;

export const startPlaybackAndResume = () => (dispatch) => {
  unmute();
  getAudioContext().resume();
  dispatch(startPlayback());
};
