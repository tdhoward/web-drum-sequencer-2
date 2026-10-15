import { createStructuredSelector } from 'reselect';
import { userSamplesSelector } from '../../common';

export const sampleSelectSelectors = createStructuredSelector({
  userSamples: userSamplesSelector,
});
