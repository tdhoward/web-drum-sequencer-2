import { getAudioContext, getCurrentBeat } from './audioContext';
import { updateChannelNodes } from './audioRouter';
import { scheduleNotes } from './audioScheduler';
import {
  channelsSelector,
  notesSelector,
  patternSelector,
  selectedPatternLengthSelector,
  setStartTime,
} from '../common';
import { INTERVAL } from './audioEngine.config';
import type { RootState } from '../reducer';

type AudioStore = {
  getState: () => RootState;
  dispatch: (action: unknown) => unknown;
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
