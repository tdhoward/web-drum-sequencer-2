import { createDefaultSequencerState } from '../../common/defaultSequencerState';
import {
  playbackSessionInitialState,
  PLAYBACK_MODES,
} from '../../common/playbackSession/playbackSession.reducer';
import { WORKSPACES } from '../../common/workspace';
import type { RootState } from '../../reducer';
import { bpmInputSelectors } from './BPMInput.selectors';

const createState = (overrides: Partial<RootState> = {}): RootState => {
  const sequencer = createDefaultSequencerState();
  return {
    ...sequencer,
    tempo: { bpm: 120, swing: 0, humanize: 0 },
    playbackSession: playbackSessionInitialState,
    workspace: {
      selectedWorkspace: WORKSPACES.PATTERN,
      selectedSongTempoColumn: 0,
    },
    ...overrides,
  } as unknown as RootState;
};

describe('BPM display during playback', () => {
  test('shows the active Song tempo and anchor in every workspace', () => {
    const state = createState({
      playbackSession: {
        ...playbackSessionInitialState,
        playing: true,
        mode: PLAYBACK_MODES.SONG,
        startTime: 10,
        arrangementIndex: 2,
        activeBpm: 90,
        activeTempoColumn: 1,
        songOccurrenceStartTime: 14,
      },
      workspace: {
        selectedWorkspace: WORKSPACES.KIT,
        selectedSongTempoColumn: 0,
      },
    });

    expect(bpmInputSelectors(state)).toEqual({
      barLengthInBeats: 4,
      bpm: 90,
      playing: true,
      startTime: 14,
    });
  });

  test('uses the first active Song pattern when the selected pattern is not playing', () => {
    const sequencer = createDefaultSequencerState();
    const state = createState({
      song: {
        ...sequencer.song,
        arrangementPatternIds: [['pattern-1']],
        tempoChanges: [120],
      },
      patterns: {
        ...sequencer.patterns,
        entities: {
          ...sequencer.patterns.entities,
          'pattern-1': {
            ...sequencer.patterns.entities['pattern-1'],
            timeSignature: { beatsPerBar: 3, beatUnit: 4 },
          },
        },
      },
      playbackSession: {
        ...playbackSessionInitialState,
        playing: true,
        mode: PLAYBACK_MODES.SONG,
        startTime: 10,
        arrangementIndex: 0,
        activeBpm: 120,
        songOccurrenceStartTime: 10,
      },
    });

    expect(bpmInputSelectors(state).barLengthInBeats).toBe(3);
  });

  test('shows Pattern playback tempo even while the Song workspace is open', () => {
    const sequencer = createDefaultSequencerState();
    const state = createState({
      song: {
        ...sequencer.song,
        arrangementPatternIds: [['pattern-0']],
        tempoChanges: [80],
      },
      playbackSession: {
        ...playbackSessionInitialState,
        playing: true,
        mode: PLAYBACK_MODES.PATTERN,
        startTime: 10,
      },
      workspace: {
        selectedWorkspace: WORKSPACES.SONG,
        selectedSongTempoColumn: 0,
      },
    });

    expect(bpmInputSelectors(state).bpm).toBe(120);
  });
});
