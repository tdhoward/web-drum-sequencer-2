import {
  setActiveSongBpm,
  setBPM,
  setSelectedSongTempoColumn,
  setSongTempo,
} from '../../common';
import { createDefaultSequencerState } from '../../common/defaultSequencerState';
import {
  playbackSessionInitialState,
  PLAYBACK_MODES,
} from '../../common/playbackSession/playbackSession.reducer';
import { WORKSPACES } from '../../common/workspace';
import { cancelScheduledNotesAfter } from '../../services/audioScheduler';
import type { RootState } from '../../reducer';
import { setWorkspaceBPM } from './BPMInput.actions';

jest.mock('../../services/audioContext');
jest.mock('../../services/audioScheduler', () => ({
  cancelScheduledNotesAfter: jest.fn(),
}));

const mockedCancelScheduledNotes = cancelScheduledNotesAfter as jest.Mock;

const createPlayingState = (mode: typeof PLAYBACK_MODES[keyof typeof PLAYBACK_MODES]) => {
  const sequencer = createDefaultSequencerState();
  return {
    ...sequencer,
    song: {
      ...sequencer.song,
      arrangementPatternIds: [['pattern-0'], ['pattern-1']],
      tempoChanges: [120, null],
    },
    tempo: { bpm: 120, swing: 0, humanize: 0 },
    playbackSession: {
      ...playbackSessionInitialState,
      playing: true,
      mode,
      startTime: 10,
      arrangementIndex: 1,
      activeBpm: 120,
      activeTempoColumn: 0,
      songOccurrenceStartTime: 12,
    },
    workspace: {
      selectedWorkspace: WORKSPACES.KIT,
      selectedSongTempoColumn: 0,
    },
  } as unknown as RootState;
};

afterEach(() => jest.clearAllMocks());

describe('setWorkspaceBPM', () => {
  test('edits the active Song marker without stopping playback from any workspace', () => {
    const state = createPlayingState(PLAYBACK_MODES.SONG);
    const dispatch = jest.fn();

    setWorkspaceBPM(135)(dispatch, () => state);

    expect(mockedCancelScheduledNotes).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      setSongTempo({ columnIndex: 0, bpm: 135 }),
      setSelectedSongTempoColumn(0),
      setActiveSongBpm(135),
      setBPM(135),
    ]);
  });

  test('keeps Pattern playback tempo global even in another workspace', () => {
    const state = createPlayingState(PLAYBACK_MODES.PATTERN);
    const dispatch = jest.fn();

    setWorkspaceBPM(110)(dispatch, () => state);

    expect(mockedCancelScheduledNotes).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(setBPM(110));
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
