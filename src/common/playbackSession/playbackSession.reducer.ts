import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getAudioContext } from '../../services/audioContext';
import { LOOKAHEAD } from '../../services/audioEngine.config';

export type PlaybackSessionState = {
  playing: boolean;
  startTime: number | null;
  currentBeat: number;
  mode: PlaybackMode;
  arrangementIndex: number;
};

export const PLAYBACK_MODES = {
  PATTERN: 'pattern',
  SONG: 'song',
} as const;

export type PlaybackMode = typeof PLAYBACK_MODES[keyof typeof PLAYBACK_MODES];

type StartPlaybackPayload = {
  startTime: number;
};

export const playbackSessionInitialState: PlaybackSessionState = {
  playing: false,
  startTime: null,
  currentBeat: 1,
  mode: PLAYBACK_MODES.PATTERN,
  arrangementIndex: 0,
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
        state.arrangementIndex = 0;
      },
      prepare() {
        return { payload: undefined };
      },
    },
    setStartTime(state, action: PayloadAction<number>) {
      state.startTime = action.payload;
    },
    setPlaybackMode(state, action: PayloadAction<PlaybackMode>) {
      state.mode = action.payload;
      state.arrangementIndex = 0;
    },
    setArrangementIndex(state, action: PayloadAction<number>) {
      state.arrangementIndex = action.payload;
    },
  },
});

export const playbackSessionReducer = playbackSessionSlice.reducer;
