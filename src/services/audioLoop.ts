import { getAudioContext, getCurrentBeat } from './audioContext';
import { updateChannelNodes } from './audioRouter';
import { clearScheduledNotes, scheduleNotes } from './audioScheduler';
import {
  PLAYBACK_MODES,
  arrangementPatternIdsSelector,
  channelsSelector,
  notesSelector,
  patternSelector,
  selectedSongTempoColumnSelector,
  selectedPatternLengthSelector,
  setSelectedSongTempoColumn,
  setSongPlaybackPosition,
  setStartTime,
  songTempoChangesSelector,
  stopPlayback,
} from '../common';
import {
  getEffectiveSongBpm,
  getEffectiveSongTempoColumn,
  getPatternLengthInQuarterBeats,
  patternIdToIndex,
} from '../common/sequencerModel';
import { INTERVAL } from './audioEngine.config';
import type { RootState } from '../reducer';

type AudioStore = {
  getState: () => RootState;
  dispatch: (action: unknown) => unknown;
};

type SongOccurrence = {
  index: number;
  patternIds: string[];
  patterns: Array<{
    id: string;
    index: number;
    lengthInBeats: number;
  }>;
  startTime: number;
  endTime: number;
  lengthInBeats: number;
  bpm: number;
};

const EMPTY_BAR_LENGTH_IN_BEATS = getPatternLengthInQuarterBeats();

type SongTransport = {
  playbackStartTime: number;
  occurrenceIndex: number;
  occurrenceStartTime: number;
  bpm: number;
};

let songTransport: SongTransport | null = null;

const createSongOccurrence = (
  state: RootState,
  index: number,
  startTime: number,
  bpm: number,
): SongOccurrence | undefined => {
  const patternIds = arrangementPatternIdsSelector(state)[index];
  if (!patternIds) return undefined;

  const patterns = patternIds.reduce<SongOccurrence['patterns']>((columnPatterns, patternId) => {
    const patternState = state.patterns.entities[patternId];
    if (patternState) {
      columnPatterns.push({
        id: patternId,
        index: patternIdToIndex(patternId),
        lengthInBeats: getPatternLengthInQuarterBeats(patternState),
      });
    }
    return columnPatterns;
  }, []);
  const lengthInBeats = patterns.length > 0
    ? Math.max(...patterns.map(pattern => pattern.lengthInBeats))
    : EMPTY_BAR_LENGTH_IN_BEATS;
  const durationSeconds = (lengthInBeats * 60) / bpm;

  return {
    index,
    patternIds: patterns.map(pattern => pattern.id),
    patterns,
    startTime,
    endTime: startTime + durationSeconds,
    lengthInBeats,
    bpm,
  };
};

export const reanchorOccurrenceStartTime = (
  occurrenceStartTime: number,
  oldBpm: number,
  newBpm: number,
  audioTime: number,
): number => {
  if (audioTime <= occurrenceStartTime) return occurrenceStartTime;
  const elapsedBeats = (audioTime - occurrenceStartTime) * (oldBpm / 60);
  return audioTime - ((elapsedBeats * 60) / newBpm);
};

export const createSongTimeline = (
  state: RootState,
  startTime: number,
): SongOccurrence[] => {
  let occurrenceStartTime = startTime;
  const tempoChanges = songTempoChangesSelector(state);
  return arrangementPatternIdsSelector(state).reduce<SongOccurrence[]>((timeline, patternIds, index) => {
    const bpm = getEffectiveSongBpm(tempoChanges, index, state.tempo.bpm);
    const occurrence = createSongOccurrence(state, index, occurrenceStartTime, bpm);
    if (!occurrence) return timeline;
    occurrenceStartTime = occurrence.endTime;
    timeline.push(occurrence);
    return timeline;
  }, []);
};

export const scheduleSongOccurrence = (
  occurrence: SongOccurrence,
  audioTime: number,
  state: RootState,
  notes: ReturnType<typeof notesSelector>,
  channels: ReturnType<typeof channelsSelector>,
): void => {
  const elapsedBeats = (audioTime - occurrence.startTime) * (occurrence.bpm / 60);
  occurrence.patterns.forEach((pattern) => {
    scheduleNotes({
      notes,
      channels,
      startTime: occurrence.startTime,
      tempo: { ...state.tempo, bpm: occurrence.bpm },
      pattern: pattern.index,
      patternLengthInBeats: pattern.lengthInBeats,
      currentBeat: 1 + elapsedBeats,
      occurrenceKey: `song-${occurrence.index}-${pattern.id}`,
      wrap: false,
    });
  });
};

const playSong = (
  store: AudioStore,
  state: RootState,
  audioTime: number,
  notes: ReturnType<typeof notesSelector>,
  channels: ReturnType<typeof channelsSelector>,
): void => {
  const playbackStartTime = state.playbackSession.startTime ?? audioTime;
  const tempoChanges = songTempoChangesSelector(state);
  if (!songTransport || songTransport.playbackStartTime !== playbackStartTime) {
    songTransport = {
      playbackStartTime,
      occurrenceIndex: 0,
      occurrenceStartTime: playbackStartTime,
      bpm: getEffectiveSongBpm(tempoChanges, 0, state.tempo.bpm),
    };
  }

  const authoredBpm = getEffectiveSongBpm(
    tempoChanges,
    songTransport.occurrenceIndex,
    state.tempo.bpm,
  );
  if (authoredBpm !== songTransport.bpm) {
    songTransport.occurrenceStartTime = reanchorOccurrenceStartTime(
      songTransport.occurrenceStartTime,
      songTransport.bpm,
      authoredBpm,
      audioTime,
    );
    songTransport.bpm = authoredBpm;
  }

  let occurrence = createSongOccurrence(
    state,
    songTransport.occurrenceIndex,
    songTransport.occurrenceStartTime,
    songTransport.bpm,
  );
  while (occurrence && audioTime >= occurrence.endTime) {
    songTransport.occurrenceIndex += 1;
    songTransport.occurrenceStartTime = occurrence.endTime;
    songTransport.bpm = getEffectiveSongBpm(
      tempoChanges,
      songTransport.occurrenceIndex,
      state.tempo.bpm,
    );
    occurrence = createSongOccurrence(
      state,
      songTransport.occurrenceIndex,
      songTransport.occurrenceStartTime,
      songTransport.bpm,
    );
  }

  if (!occurrence) {
    clearScheduledNotes();
    songTransport = null;
    store.dispatch(stopPlayback());
    return;
  }

  const activeTempoColumn = getEffectiveSongTempoColumn(tempoChanges, occurrence.index);
  if (
    state.playbackSession.arrangementIndex !== occurrence.index
    || state.playbackSession.activeBpm !== occurrence.bpm
    || state.playbackSession.activeTempoColumn !== activeTempoColumn
    || state.playbackSession.songOccurrenceStartTime !== occurrence.startTime
  ) {
    store.dispatch(setSongPlaybackPosition({
      arrangementIndex: occurrence.index,
      activeBpm: occurrence.bpm,
      activeTempoColumn,
      occurrenceStartTime: occurrence.startTime,
    }));
  }
  if (selectedSongTempoColumnSelector(state) !== activeTempoColumn) {
    store.dispatch(setSelectedSongTempoColumn(activeTempoColumn));
  }

  scheduleSongOccurrence(occurrence, audioTime, state, notes, channels);
  const nextIndex = occurrence.index + 1;
  const nextBpm = getEffectiveSongBpm(tempoChanges, nextIndex, state.tempo.bpm);
  const nextOccurrence = createSongOccurrence(state, nextIndex, occurrence.endTime, nextBpm);
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
      songTransport = null;
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
    } else {
      songTransport = null;
    }
  }, INTERVAL);
};
