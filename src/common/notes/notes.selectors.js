import { createSelector } from 'reselect';
import { channelsStateSelector } from '../channels';
import { patternsSelector } from '../patterns';
import { notesStateToLegacyNotes } from '../sequencerModel';

export const notesStateSelector = state => state.notes;

export const notesSelector = createSelector(
  notesStateSelector,
  channelsStateSelector,
  patternsSelector,
  (notesState, channelsState, patternsState) => notesStateToLegacyNotes({
    notesState,
    channelsState,
    patternsState,
  }),
);
