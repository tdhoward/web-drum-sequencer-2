import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getAudioContext } from '../../services/audioContext';
import { LOOKAHEAD } from '../../services/audioEngine.config';

export type PlaybackSessionState = {
  playing: boolean;
  startTime: number | null;
  currentBeat: number;
};

type StartPlaybackPayload = {
  startTime: number;
};

export const playbackSessionInitialState: PlaybackSessionState = {
  playing: false,
  startTime: null,
  currentBeat: 1,
};

export const playbackSessionSlice = createSlice({
  name: 'playbackSession',
  initialState: playbackSessionInitialState,
  reducers: {
    startPlayback: {
      reducer(state, action: PayloadAction<StartPlaybackPayload>) {
        state.playing = true;
        state.startTime = action.payload.startTime;
      },
      prepare() {
        return {
          payload: {
            startTime: getAudioContext().currentTime + LOOKAHEAD + LOOKAHEAD,
          },
        };
      },
    },
    stopPlayback: {
      reducer(state) {
        state.playing = false;
        state.startTime = null;
      },
      prepare() {
        return { payload: undefined };
      },
    },
    setStartTime(state, action: PayloadAction<number>) {
      state.startTime = action.payload;
    },
  },
});

export const playbackSessionReducer = playbackSessionSlice.reducer;
