import { connect } from 'react-redux';
import { playbackModeSelector, setPlaybackMode, stopPlayback, type PlaybackMode } from '../../common';
import { clearScheduledNotes } from '../../services/audioScheduler';
import { stopAllNotes } from '../../services/audioRouter';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import { PlaybackModeSwitchComponent } from './PlaybackModeSwitch.component';

const mapStateToProps = (state: RootState) => ({ mode: playbackModeSelector(state) });

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  onChange: (mode: PlaybackMode) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
    dispatch(setPlaybackMode(mode));
  },
});

export const PlaybackModeSwitch = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PlaybackModeSwitchComponent);
