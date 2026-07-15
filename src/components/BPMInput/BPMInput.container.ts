import { connect } from 'react-redux';
import { BPMInputComponent } from './BPMInput.component';
import { bpmInputSelectors } from './BPMInput.selectors';
import { setWorkspaceBPM } from './BPMInput.actions';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => bpmInputSelectors(state);

const mapDispatchToProps = {
  setBPM: setWorkspaceBPM,
};

export const BPMInput = connect(
  mapStateToProps,
  mapDispatchToProps,
)(BPMInputComponent);
