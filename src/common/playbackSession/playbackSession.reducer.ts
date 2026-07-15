import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getAudioContext } from '../../services/audioContext';
import { LOOKAHEAD } from '../../services/audioEngine.config';

export type PlaybackSessionState = {
  playing: boolean;
  startTime: number | null;
  currentBeat: number;
  mode: PlaybackMode;
  arrangementIndex: number;
  activeBpm: number | null;
  activeTempoColumn: number;
  songOccurrenceStartTime: number | null;
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
  activeBpm: null,
  activeTempoColumn: 0,
  songOccurrenceStartTime: null,
};

export const playbackSessionSlice = createSlice({
  name: 'playbackSession',
  initialState: playbackSessionInitialState,
  reducers: {
    startPlayback: {
      reducer(state, action: PayloadAction<StartPlaybackPayload>) {
        state.playing = true;
        state.startTime = action.payload.startTime;
        state.activeBpm = null;
        state.activeTempoColumn = 0;
        state.songOccurrenceStartTime = null;
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
        state.activeBpm = null;
        state.activeTempoColumn = 0;
        state.songOccurrenceStartTime = null;
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
    setActiveSongBpm(state, action: PayloadAction<number>) {
      state.activeBpm = action.payload;
    },
    setSongPlaybackPosition(state, action: PayloadAction<{
      arrangementIndex: number;
      activeBpm: number;
      activeTempoColumn: number;
      occurrenceStartTime: number;
    }>) {
      state.arrangementIndex = action.payload.arrangementIndex;
      state.activeBpm = action.payload.activeBpm;
      state.activeTempoColumn = action.payload.activeTempoColumn;
      state.songOccurrenceStartTime = action.payload.occurrenceStartTime;
    },
  },
});

export const playbackSessionReducer = playbackSessionSlice.reducer;
