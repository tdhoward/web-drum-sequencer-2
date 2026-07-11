import { createStructuredSelector } from 'reselect';
import { selectedPatternBeatsPerBarSelector } from '../../common';

export const patternChannelHeaderSelectors = createStructuredSelector({
  beatsPerBar: selectedPatternBeatsPerBarSelector,
});
