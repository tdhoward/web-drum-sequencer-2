import { getCurrentBeat } from './audioContext';
import { swing } from './swing';
import {
  PLAYBACK_MODES,
  selectedPatternIdSelector,
  selectedPatternLengthSelector,
} from '../common';
import { createSongTimeline } from './audioLoop';
import type { RootState } from '../reducer';

type AnimationStore = {
  getState: () => RootState;
};

const draw = (store: AnimationStore): void => {
  // Get some data from redux store
  const state = store.getState();
  const { bpm, swing: swingAmount } = state.tempo;
  const {
    arrangementIndex,
    mode,
    playing,
    startTime,
  } = state.playbackSession;
  let patternLengthInBeats = selectedPatternLengthSelector(state);
  let patternStartTime = startTime ?? 0;
  let animateSelectedPattern = playing;

  if (playing && mode === PLAYBACK_MODES.SONG) {
    const occurrence = createSongTimeline(state, patternStartTime).find(
      item => item.index === arrangementIndex,
    );
    animateSelectedPattern = Boolean(
      occurrence && occurrence.patternIds.includes(selectedPatternIdSelector(state)),
    );
    if (occurrence) {
      patternStartTime = occurrence.startTime;
      patternLengthInBeats = occurrence.lengthInBeats;
    }
  }

  const currentBeat = getCurrentBeat(
    bpm,
    patternStartTime,
    undefined,
    patternLengthInBeats,
  );

  // Grab all the toggles and animate them
  const toggles = document.getElementsByClassName('wds-beat-marker');
  for (let i = 0; i < toggles.length; i += 1) {
    const toggle = toggles[i] as HTMLElement;
    const { beat, active } = toggle.dataset;
    const beatNum = parseFloat(beat || '');
    const swingBeat = swing(beatNum, swingAmount);
    const isActive = (active === 'true');
    if (animateSelectedPattern
      && isActive
      && currentBeat - swingBeat < 0.25
      && currentBeat - swingBeat > 0
    ) {
      toggle.style.transition = 'all 0s';
      toggle.style.opacity = '0.8';
      toggle.style.transform = 'scale(1.3)';
    } else {
      toggle.style.transition = `all ${120 / bpm}s`;
      toggle.style.opacity = '0';
      toggle.style.transform = 'scale(1)';
    }
  }

  window.requestAnimationFrame(() => {
    draw(store);
  });
};

export const startAnimations = (store: AnimationStore): void => {
  window.requestAnimationFrame(() => {
    draw(store);
  });
};
