import { getCurrentBeat } from './audioContext';
import { swing } from './swing';
import {
  PLAYBACK_MODES,
  arrangementPatternIdsSelector,
  selectedPatternIdSelector,
  selectedPatternLengthSelector,
} from '../common';
import { getPatternLengthInQuarterBeats } from '../common/sequencerModel';
import type { RootState } from '../reducer';

type AnimationStore = {
  getState: () => RootState;
};

const draw = (store: AnimationStore): void => {
  // Get some data from redux store
  const state = store.getState();
  let { bpm } = state.tempo;
  const { swing: swingAmount } = state.tempo;
  const {
    arrangementIndex,
    activeBpm,
    mode,
    playing,
    songOccurrenceStartTime,
    startTime,
  } = state.playbackSession;
  let patternLengthInBeats = selectedPatternLengthSelector(state);
  let patternStartTime = startTime ?? 0;
  let animateSelectedPattern = playing;

  if (playing && mode === PLAYBACK_MODES.SONG) {
    const patternIds = arrangementPatternIdsSelector(state)[arrangementIndex] || [];
    const patternLengths = patternIds.map(patternId => (
      getPatternLengthInQuarterBeats(state.patterns.entities[patternId])
    ));
    animateSelectedPattern = patternIds.includes(selectedPatternIdSelector(state));
    patternStartTime = songOccurrenceStartTime ?? patternStartTime;
    patternLengthInBeats = patternLengths.length > 0
      ? Math.max(...patternLengths)
      : getPatternLengthInQuarterBeats();
    bpm = activeBpm ?? bpm;
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
