import { createStructuredSelector } from 'reselect';
import {
  notesSelector,
  patternSelector,
  selectedChannelSelector,
} from '../../common';

export const patternChannelSelectors = createStructuredSelector({
  notes: notesSelector,
  pattern: patternSelector,
  selectedChannelId: selectedChannelSelector,
});
