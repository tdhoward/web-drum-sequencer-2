import { createStructuredSelector } from 'reselect';
import { selectedPatternPackIdSelector } from '../../common';

export const patternPackSelectorSelectors = createStructuredSelector({
  selectedPatternPackId: selectedPatternPackIdSelector,
});
