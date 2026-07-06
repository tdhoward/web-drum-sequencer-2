import { connect } from 'react-redux';
import { PatternSelectorComponent } from './PatternSelector.component';
import { patternSelectorSelectors } from './PatternSelector.selectors';
import { setPattern } from '../../common';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => patternSelectorSelectors(state);

const mapDispatchToProps = {
  onSelectPattern: setPattern,
};

export const PatternSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PatternSelectorComponent);
