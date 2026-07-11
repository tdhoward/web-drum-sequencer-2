import { getAudioContext, getCurrentBeat } from './audioContext';
import { updateChannelNodes } from './audioRouter';
import { clearScheduledNotes, scheduleNotes } from './audioScheduler';
import {
  PLAYBACK_MODES,
  arrangementPatternIdsSelector,
  channelsSelector,
  notesSelector,
  patternSelector,
  selectedPatternLengthSelector,
  setArrangementIndex,
  setStartTime,
  stopPlayback,
} from '../common';
import { getPatternLengthInQuarterBeats, patternIdToIndex } from '../common/sequencerModel';
import { INTERVAL } from './audioEngine.config';
import type { RootState } from '../reducer';

type AudioStore = {
  getState: () => RootState;
  dispatch: (action: unknown) => unknown;
};

type SongOccurrence = {
  index: number;
  patternId: string;
  pattern: number;
  startTime: number;
  endTime: number;
  lengthInBeats: number;
};

export const createSongTimeline = (
  state: RootState,
  startTime: number,
): SongOccurrence[] => {
  let occurrenceStartTime = startTime;
  return arrangementPatternIdsSelector(state).reduce<SongOccurrence[]>((timeline, patternId, index) => {
    if (patternId === null) return timeline;
    const patternState = state.patterns.entities[patternId];
    if (!patternState) return timeline;
    const lengthInBeats = getPatternLengthInQuarterBeats(patternState);
    const durationSeconds = (lengthInBeats * 60) / state.tempo.bpm;
    const occurrence = {
      index,
      patternId,
      pattern: patternIdToIndex(patternId),
      startTime: occurrenceStartTime,
      endTime: occurrenceStartTime + durationSeconds,
      lengthInBeats,
    };
    occurrenceStartTime = occurrence.endTime;
    timeline.push(occurrence);
    return timeline;
  }, []);
};

const scheduleSongOccurrence = (
  occurrence: SongOccurrence,
  audioTime: number,
  state: RootState,
  notes: ReturnType<typeof notesSelector>,
  channels: ReturnType<typeof channelsSelector>,
): void => {
  const elapsedBeats = (audioTime - occurrence.startTime) * (state.tempo.bpm / 60);
  scheduleNotes({
    notes,
    channels,
    startTime: occurrence.startTime,
    tempo: state.tempo,
    pattern: occurrence.pattern,
    patternLengthInBeats: occurrence.lengthInBeats,
    currentBeat: 1 + elapsedBeats,
    occurrenceKey: `song-${occurrence.index}`,
    wrap: false,
  });
};

const playSong = (
  store: AudioStore,
  state: RootState,
  audioTime: number,
  notes: ReturnType<typeof notesSelector>,
  channels: ReturnType<typeof channelsSelector>,
): void => {
  const startTime = state.playbackSession.startTime ?? audioTime;
  const timeline = createSongTimeline(state, startTime);
  const finalOccurrence = timeline[timeline.length - 1];

  if (!finalOccurrence || audioTime >= finalOccurrence.endTime) {
    clearScheduledNotes();
    store.dispatch(stopPlayback());
    return;
  }

  const timelineIndex = timeline.findIndex(occurrence => audioTime < occurrence.endTime);
  const occurrence = timeline[Math.max(0, timelineIndex)];
  if (state.playbackSession.arrangementIndex !== occurrence.index) {
    store.dispatch(setArrangementIndex(occurrence.index));
  }

  scheduleSongOccurrence(occurrence, audioTime, state, notes, channels);
  const nextOccurrence = timeline[timelineIndex + 1];
  if (nextOccurrence) {
    scheduleSongOccurrence(nextOccurrence, audioTime, state, notes, channels);
  }
};

export const initializeAudio = (store: AudioStore): void => {
  const audioCtx = getAudioContext(); // Start the clock
  setInterval(() => {
    const state = store.getState();
    const {
      playbackSession,
      tempo,
    } = state;
    const channels = channelsSelector(state);
    const notes = notesSelector(state);
    const pattern = patternSelector(state);
    const patternLengthInBeats = selectedPatternLengthSelector(state);

    updateChannelNodes(channels);

    if (playbackSession.playing) {
      if (playbackSession.mode === PLAYBACK_MODES.SONG) {
        playSong(store, state, audioCtx.currentTime, notes, channels);
        return;
      }
      const playbackStartTime = playbackSession.startTime ?? audioCtx.currentTime;
      let sT = playbackStartTime;
      // Loop if we reached the end of the pattern
      const patternLengthSeconds = (patternLengthInBeats * 60) / tempo.bpm;
      if (audioCtx.currentTime > playbackStartTime + patternLengthSeconds) {
        store.dispatch(setStartTime(playbackStartTime + patternLengthSeconds));
        sT = playbackStartTime + patternLengthSeconds;
      }

      scheduleNotes({
        notes,
        channels,
        startTime: sT,
        tempo,
        pattern,
        patternLengthInBeats,
        currentBeat: getCurrentBeat(
          tempo.bpm,
          playbackStartTime,
          undefined,
          patternLengthInBeats,
        ),
      });
    }
  }, INTERVAL);
};
