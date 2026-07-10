import { connect } from 'react-redux';
import {
  selectedPatternIdSelector,
  selectedPatternNameSelector,
  setPatternName,
} from '../../common';
import { PatternNameInputComponent } from './PatternNameInput.component';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => ({
  patternName: selectedPatternNameSelector(state),
  selectedPatternId: selectedPatternIdSelector(state),
});

const mapDispatchToProps = {
  setPatternName,
};

const mergeProps = (
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: typeof mapDispatchToProps,
) => ({
  patternName: stateProps.patternName,
  onSetPatternName: (name: string) => {
    dispatchProps.setPatternName({
      patternId: stateProps.selectedPatternId,
      name,
    });
  },
});

export const PatternNameInput = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PatternNameInputComponent);
