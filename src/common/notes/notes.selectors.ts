// Legacy UI/audio compatibility: returns notes in the old notes[channelId][patternIndex] shape.
import { createSelector } from 'reselect';
import { channelsSelector } from '../channels';
import { patternsSelector } from '../patterns';
import { notesStateToLegacyNotes } from '../sequencerModel';
import type { LegacyNotes, NotesState, SequencerRootState } from '../sequencerModel';

type NotesRootState = SequencerRootState & {
  notes: NotesState;
};

export const notesStateSelector = (state: NotesRootState): NotesState => state.notes;

export const notesSelector = createSelector(
  notesStateSelector,
  channelsSelector,
  patternsSelector,
  (notesState, channels, patternsState): LegacyNotes => notesStateToLegacyNotes({
    notesState,
    patternsState,
    laneIds: channels.map(channel => channel.id),
  }),
);
