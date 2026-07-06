import { connect } from 'react-redux';
import { BPMInputComponent } from './BPMInput.component';
import { bpmInputSelectors } from './BPMInput.selectors';
import { setBPM } from '../../common';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => bpmInputSelectors(state);

const mapDispatchToProps = {
  setBPM,
};

export const BPMInput = connect(
  mapStateToProps,
  mapDispatchToProps,
)(BPMInputComponent);
