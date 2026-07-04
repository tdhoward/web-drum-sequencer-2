import { connect } from 'react-redux';
import patternPacks from '../../patternPacks';
import { loadPatternPack } from '../../common';
import { PatternPackSelectorComponent } from './PatternPackSelector.component';
import { patternPackSelectorSelectors } from './PatternPackSelector.selectors';
import type { PatternPack } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type PatternPackSelectorDispatchProps = {
  loadPatternPack: (patternPack: PatternPack) => void;
};

type PatternPackSelectOption = {
  value: PatternPack;
};

const mapStateToProps = (state: RootState) => patternPackSelectorSelectors(state);

type PatternPackSelectorStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): PatternPackSelectorDispatchProps => ({
  loadPatternPack: (patternPack) => {
    dispatch(loadPatternPack(patternPack) as unknown as AppAction);
  },
});

const mergeProps = (
  stateProps: PatternPackSelectorStateProps,
  dispatchProps: PatternPackSelectorDispatchProps,
) => ({
  ...stateProps,
  patternPacks,
  onSelectPatternPack: ({ value }: PatternPackSelectOption) => {
    dispatchProps.loadPatternPack(value);
  },
});

export const PatternPackSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PatternPackSelectorComponent);
