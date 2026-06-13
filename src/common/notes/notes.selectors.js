import { createSelector } from 'reselect';
import { channelsSelector } from '../channels';
import { patternsSelector } from '../patterns';
import { notesStateToLegacyNotes } from '../sequencerModel';

export const notesStateSelector = state => state.notes;

export const notesSelector = createSelector(
  notesStateSelector,
  channelsSelector,
  patternsSelector,
  (notesState, channels, patternsState) => notesStateToLegacyNotes({
    notesState,
    patternsState,
    laneIds: channels.map(channel => channel.id),
  }),
);
