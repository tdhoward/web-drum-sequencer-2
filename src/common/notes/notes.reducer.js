import { createSlice } from '@reduxjs/toolkit';
import { uuid } from '../../services/uuid';
import presets from '../../presets';
import { EMPTY_NOTE_ROW } from '../../presets/empty';

export const notesInitialState = presets[1].notes;

const toggleNoteInRow = (noteAr, beat, id) => {
  const noteIndex = noteAr.findIndex(note => note.beat === beat);
  if (noteIndex >= 0) {
    noteAr.splice(noteIndex, 1);
    return;
  }

  noteAr.push({
    beat,
    id,
  });
};

export const notesSlice = createSlice({
  name: 'notes',
  initialState: notesInitialState,
  reducers: {
    toggleNote: {
      reducer(state, action) {
        const { channelID, pattern, beat, id } = action.payload;
        toggleNoteInRow(state[channelID][pattern], beat, id);
      },
      prepare(channelID, pattern, beat) {
        return { payload: { channelID, pattern, beat, id: uuid() } };
      },
    },
    initializeChannelNotes(state, action) {
      state[action.payload] = EMPTY_NOTE_ROW;
    },
    removeChannelNotes(state, action) {
      state[action.payload] = undefined;
    },
    setNotes(state, action) {
      return { ...action.payload };
    },
  },
});

export const {
  initializeChannelNotes,
  removeChannelNotes,
  setNotes,
  toggleNote,
} = notesSlice.actions;

export const notesReducer = notesSlice.reducer;
