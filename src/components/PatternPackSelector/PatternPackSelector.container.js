import { connect } from 'react-redux';
import { compose, withHandlers, withProps } from 'recompose';
import patternPacks from '../../patternPacks';
import { loadPatternPack } from '../../common';
import { PatternPackSelectorComponent } from './PatternPackSelector.component';
import { patternPackSelectorSelectors } from './PatternPackSelector.selectors';

const mapDispatchToProps = {
  loadPatternPack,
};

export const PatternPackSelector = compose(
  connect(patternPackSelectorSelectors, mapDispatchToProps),
  withProps({
    patternPacks,
  }),
  withHandlers({
    onSelectPatternPack: props => ({ value }) => {
      props.loadPatternPack(value);
    },
  }),
)(PatternPackSelectorComponent);
