import { uuid } from '../../services/uuid';
import {
  addNote,
  legacyToggleNote,
  removeNote,
} from './notes.reducer';
import {
  beatToStep,
  patternIndexToId,
} from '../sequencerModel';
import type { Note, NotesState, PatternsState, SequencerRootState } from '../sequencerModel';
import { patternsSelector } from '../patterns';

type ToggleNoteRootState = SequencerRootState & {
  notes: NotesState;
  patterns: PatternsState;
};

type Dispatch = (action: unknown) => void;

const findExistingNote = (
  state: ToggleNoteRootState,
  laneId: string,
  patternId: string,
  step: number,
): Note | undefined => state.notes.ids
  .map(noteId => state.notes.entities[noteId])
  .find(note => note.laneId === laneId
    && note.patternId === patternId
    && note.step === step);

export const toggleNote = (
  channelId: string,
  patternIndex: number,
  beat: number,
) => (dispatch: Dispatch, getState: () => ToggleNoteRootState): void => {
  const state = getState();
  const laneId = channelId;
  const patternId = patternIndexToId(patternIndex);
  const pattern = patternsSelector(state).entities[patternId];
  const step = beatToStep(beat, pattern);
  const existingNote = findExistingNote(state, laneId, patternId, step);

  if (existingNote) {
    dispatch(removeNote(existingNote));
    return;
  }

  dispatch(addNote({
    id: uuid(),
    laneId,
    patternId,
    step,
    pitch: 0,
    velocity: 1,
  }));
};

export { legacyToggleNote };
