import { createStructuredSelector } from 'reselect';
import {
  hasPlayableArrangementSelector,
  playbackModeSelector,
  playingSelector,
  PLAYBACK_MODES,
} from '../../common';

export const playButtonSelectors = createStructuredSelector({
  playing: playingSelector,
  disabled: state => (
    playbackModeSelector(state) === PLAYBACK_MODES.SONG
    && !hasPlayableArrangementSelector(state)
  ),
});
