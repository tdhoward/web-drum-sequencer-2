import { createStructuredSelector } from 'reselect';
import { humanizeSelector } from '../../common';

export const humanizeControlSelectors = createStructuredSelector({
  humanize: humanizeSelector,
});
