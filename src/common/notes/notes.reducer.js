import { createSlice } from '@reduxjs/toolkit';
import {
  normalizeNotesState,
  createPatternIds,
  patternIndexToId,
  beatToStep,
} from '../sequencerModel';
import { createDefaultNotesState } from '../defaultSequencerState';

export const notesInitialState = createDefaultNotesState();

const removeNoteById = (state, noteId) => {
  state.ids = state.ids.filter(id => id !== noteId);
  delete state.entities[noteId];
};

export const notesSlice = createSlice({
  name: 'notes',
  initialState: notesInitialState,
  reducers: {
    addNote(state, action) {
      const note = {
        ...action.payload,
        laneId: action.payload.laneId || action.payload.channelId,
      };
      delete note.channelId;
      if (!state.entities[note.id]) {
        state.ids.push(note.id);
      }
      state.entities[note.id] = note;
    },
    removeNote(state, action) {
      removeNoteById(state, action.payload.id);
    },
    initializeChannelNotes() {
      return undefined;
    },
    removeChannelNotes(state, action) {
      state.ids
        .map(id => state.entities[id])
        .filter(note => note.laneId === action.payload)
        .forEach(note => removeNoteById(state, note.id));
    },
    setNotes(state, action) {
      return normalizeNotesState(action.payload);
    },
    toggleNote: {
      reducer(state, action) {
        const { channelId, pattern, beat, id } = action.payload;
        const laneId = channelId;
        const patternId = patternIndexToId(pattern);
        const step = beatToStep(beat);
        const existingNote = state.ids
          .map(noteId => state.entities[noteId])
          .find(note => note.laneId === laneId
            && note.patternId === patternId
            && note.step === step);

        if (existingNote) {
          removeNoteById(state, existingNote.id);
          return;
        }

        state.ids.push(id);
        state.entities[id] = {
          id,
          laneId,
          patternId,
          step,
          pitch: 0,
          velocity: 1,
        };
      },
      prepare(channelId, pattern, beat, id) {
        return { payload: { channelId, pattern, beat, id } };
      },
    },
  },
});

export const {
  addNote,
  removeNote,
  initializeChannelNotes,
  removeChannelNotes,
  setNotes,
} = notesSlice.actions;

export const legacyToggleNote = notesSlice.actions.toggleNote;

export const createEmptyNotesForChannels = (channels, patternCount) => normalizeNotesState(
  channels.reduce((notes, channel) => ({
    ...notes,
    [channel.laneId || channel.id]: createPatternIds(patternCount).map(() => []),
  }), {}),
);

export const notesReducer = notesSlice.reducer;
