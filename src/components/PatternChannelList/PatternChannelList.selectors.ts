import { createStructuredSelector } from 'reselect';
import { channelsSelector } from '../../common';

export const patternChannelListSelectors = createStructuredSelector({
  channels: channelsSelector,
});
