import { connect } from 'react-redux';
import {
  playingSelector,
  selectedPatternIdSelector,
  selectedPatternStepsPerBeatSelector,
  selectedPatternTimeSignatureSelector,
  setPatternTimeSignature,
  type TimeSignaturePreset,
} from '../../common';
import { stopAllNotes } from '../../services/audioRouter';
import { clearScheduledNotes } from '../../services/audioScheduler';
import { TimeSignatureSelectorComponent } from './TimeSignatureSelector.component';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => ({
  playing: playingSelector(state),
  selectedPatternId: selectedPatternIdSelector(state),
  selectedStepsPerBeat: selectedPatternStepsPerBeatSelector(state),
  selectedTimeSignature: selectedPatternTimeSignatureSelector(state),
});

const mapDispatchToProps = {
  setPatternTimeSignature,
};

const mergeProps = (
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: typeof mapDispatchToProps,
) => ({
  selectedStepsPerBeat: stateProps.selectedStepsPerBeat,
  selectedTimeSignature: stateProps.selectedTimeSignature,
  onSelectTimeSignature: (preset: TimeSignaturePreset) => {
    if (stateProps.playing) {
      stopAllNotes();
      clearScheduledNotes();
    }

    dispatchProps.setPatternTimeSignature({
      patternId: stateProps.selectedPatternId,
      timeSignature: preset.timeSignature,
      stepsPerBeat: preset.stepsPerBeat,
    });
  },
});

export const TimeSignatureSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(TimeSignatureSelectorComponent);
