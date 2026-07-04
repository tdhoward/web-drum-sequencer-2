import { connect } from 'react-redux';
import patternPacks from '../../patternPacks';
import {
  doSavePatternPack,
  erasePatternPack,
  loadPatternPack,
  setPatternPackPrompt,
} from '../../common';
import { PatternPackSelectorComponent } from './PatternPackSelector.component';
import { patternPackSelectorSelectors } from './PatternPackSelector.selectors';
import type { PatternPack } from '../../common/sequencerModel';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type PatternPackSelectorDispatchProps = {
  doSavePatternPack: (patternPackId: string) => void;
  erasePatternPack: (patternPackId: string) => void;
  loadPatternPack: (patternPack: PatternPack) => void;
  setPatternPackPrompt: (isOpen: boolean) => void;
};

type PatternPackSelectOption = {
  value: PatternPack | string;
};

const mapStateToProps = (state: RootState) => patternPackSelectorSelectors(state);

type PatternPackSelectorStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): PatternPackSelectorDispatchProps => ({
  doSavePatternPack: (patternPackId) => {
    dispatch(doSavePatternPack(patternPackId) as unknown as AppAction);
  },
  erasePatternPack: (patternPackId) => {
    dispatch(erasePatternPack(patternPackId) as unknown as AppAction);
  },
  loadPatternPack: (patternPack) => {
    dispatch(loadPatternPack(patternPack) as unknown as AppAction);
  },
  setPatternPackPrompt: (isOpen) => {
    dispatch(setPatternPackPrompt(isOpen));
  },
});

const mergeProps = (
  stateProps: PatternPackSelectorStateProps,
  dispatchProps: PatternPackSelectorDispatchProps,
) => ({
  ...stateProps,
  patternPacks,
  onSelectPatternPack: ({ value }: PatternPackSelectOption) => {
    const currentPatternPackId = stateProps.currentPatternPack?.id;

    switch (value) {
      case 'SAVE_PATTERN_PACK':
        if (currentPatternPackId) {
          dispatchProps.doSavePatternPack(currentPatternPackId);
        }
        break;
      case 'DELETE_PATTERN_PACK':
        if (currentPatternPackId) {
          dispatchProps.erasePatternPack(currentPatternPackId);
        }
        break;
      case 'SAVE_PATTERN_PACK_AS':
        dispatchProps.setPatternPackPrompt(true);
        break;
      default:
        if (typeof value !== 'string') {
          dispatchProps.loadPatternPack(value);
        }
        break;
    }
  },
});

export const PatternPackSelector = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PatternPackSelectorComponent);
