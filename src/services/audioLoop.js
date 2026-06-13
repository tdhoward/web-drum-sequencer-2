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

export const initializeAudio = (store) => {
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
      let sT = playbackSession.startTime;
      // Loop if we reached the end of the pattern
      const patternLengthSeconds = (patternLengthInBeats * 60) / tempo.bpm;
      if (audioCtx.currentTime > playbackSession.startTime + patternLengthSeconds) {
        store.dispatch(setStartTime(playbackSession.startTime + patternLengthSeconds));
        sT = playbackSession.startTime + patternLengthSeconds;
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
          playbackSession.startTime,
          undefined,
          patternLengthInBeats,
        ),
      });
    }
  }, INTERVAL);
};
