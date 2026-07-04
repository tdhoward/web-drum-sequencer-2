import { connect } from 'react-redux';
import { PlayButtonComponent } from './PlayButton.component';
import { playButtonSelectors } from './PlayButton.selectors';
import { startPlaybackAndResume, stopPlayback } from '../../common';
import { stopAllNotes } from '../../services/audioRouter';
import { clearScheduledNotes } from '../../services/audioScheduler';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => playButtonSelectors(state);

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  startPlaybackAndResume: () => {
    dispatch(startPlaybackAndResume());
  },
  stopPlayback: () => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
  },
});

export const PlayButton = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PlayButtonComponent);
