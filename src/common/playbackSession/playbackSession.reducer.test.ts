import {
  playbackSessionInitialState,
  playbackSessionReducer,
  PLAYBACK_MODES,
} from './playbackSession.reducer';
import {
  startPlayback,
  stopPlayback,
  setStartTime,
  setPlaybackMode,
  setSongPlaybackPosition,
} from './playbackSession.actions';
import { LOOKAHEAD } from '../../services/audioEngine.config';

jest.mock('../../services/audioContext');

describe('startPlayback', () => {
  test('should set playing to true', () => {
    const state = playbackSessionReducer(playbackSessionInitialState, startPlayback());
    expect(state.playing).toBe(true);
  });

  test('should set startTime to current time plus lookahead', () => {
    const state = playbackSessionReducer(playbackSessionInitialState, startPlayback());
    expect(state.startTime).toBe(1 + LOOKAHEAD + LOOKAHEAD);
  });
});

describe('stopPlayback', () => {
  test('should set playing to false', () => {
    const state = playbackSessionReducer(playbackSessionInitialState, stopPlayback());
    expect(state.playing).toBe(false);
  });

  test('should set startTime to null', () => {
    const state = playbackSessionReducer(playbackSessionInitialState, stopPlayback());
    expect(state.startTime).toBeNull();
  });

  test('should ignore accidental event arguments', () => {
    const stopPlaybackFromEvent = stopPlayback as unknown as (
      event: unknown,
    ) => ReturnType<typeof stopPlayback>;
    const action = stopPlaybackFromEvent({ type: 'click' });
    expect(action.payload).toBeUndefined();
  });
});

describe('setStartTime', () => {
  test('should set startTime', () => {
    const state = playbackSessionReducer(playbackSessionInitialState, setStartTime(2.1234));
    expect(state.startTime).toBe(2.1234);
  });
});

describe('setPlaybackMode', () => {
  test('switches between pattern and song playback', () => {
    const state = playbackSessionReducer(
      playbackSessionInitialState,
      setPlaybackMode(PLAYBACK_MODES.SONG),
    );

    expect(state.mode).toBe(PLAYBACK_MODES.SONG);
    expect(state.arrangementIndex).toBe(0);
  });

  test('clears the active Song tempo and timing anchor', () => {
    const playingState = playbackSessionReducer(
      playbackSessionInitialState,
      setSongPlaybackPosition({
        arrangementIndex: 2,
        activeBpm: 90,
        activeTempoColumn: 1,
        occurrenceStartTime: 12,
      }),
    );
    const state = playbackSessionReducer(playingState, stopPlayback());

    expect(state.activeBpm).toBeNull();
    expect(state.activeTempoColumn).toBe(0);
    expect(state.songOccurrenceStartTime).toBeNull();
  });
});
