import { connect } from 'react-redux';
import {
  selectedPatternIdSelector,
  selectedPatternStepsPerBeatSelector,
  selectedPatternTimeSignatureSelector,
  setPatternTimeSignature,
  type TimeSignaturePreset,
} from '../../common';
import { TimeSignatureSelectorComponent } from './TimeSignatureSelector.component';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => ({
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
