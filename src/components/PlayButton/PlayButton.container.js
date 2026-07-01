import { connect } from 'react-redux';
import { compose } from 'recompose';
import { PlayButtonComponent } from './PlayButton.component';
import { playButtonSelectors } from './PlayButton.selectors';
import { startPlaybackAndResume, stopPlayback } from '../../common';
import { stopAllNotes } from '../../services/audioRouter';
import { clearScheduledNotes } from '../../services/audioScheduler';

const mapDispatchToProps = dispatch => ({
  startPlaybackAndResume: () => dispatch(startPlaybackAndResume()),
  stopPlayback: () => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
  },
});

export const PlayButton = compose(
  connect(playButtonSelectors, mapDispatchToProps),
)(PlayButtonComponent);
