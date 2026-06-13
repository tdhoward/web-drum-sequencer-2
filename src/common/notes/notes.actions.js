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
import { patternsSelector } from '../patterns';

const findExistingNote = (state, channelID, patternId, step) => state.notes.ids
  .map(noteId => state.notes.entities[noteId])
  .find(note => note.channelId === channelID
    && note.patternId === patternId
    && note.step === step);

export const toggleNote = (channelID, patternIndex, beat) => (dispatch, getState) => {
  const state = getState();
  const patternId = patternIndexToId(patternIndex);
  const pattern = patternsSelector(state).entities[patternId];
  const step = beatToStep(beat, pattern);
  const existingNote = findExistingNote(state, channelID, patternId, step);

  if (existingNote) {
    dispatch(removeNote(existingNote));
    return;
  }

  dispatch(addNote({
    id: uuid(),
    channelId: channelID,
    patternId,
    step,
    pitch: 0,
    velocity: 1,
  }));
};

export { legacyToggleNote };
