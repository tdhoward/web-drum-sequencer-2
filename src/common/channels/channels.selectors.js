import { createSelector } from 'reselect';

export const channelsStateSelector = state => state.channels;

export const channelsSelector = createSelector(
  channelsStateSelector,
  channels => channels.ids.map(id => channels.entities[id]),
);
