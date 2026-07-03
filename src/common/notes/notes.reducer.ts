import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import {
  normalizeNotesState,
  createPatternIds,
  patternIndexToId,
  beatToStep,
} from '../sequencerModel';
import type { LegacyNotes, Note, NotesState } from '../sequencerModel';
import { createDefaultNotesState } from '../defaultSequencerState';

export const notesInitialState = createDefaultNotesState();

type AddNotePayload = Note & {
  channelId?: string;
};

type RemoveNotePayload = {
  id: string;
};

type ToggleNotePayload = {
  channelId: string;
  pattern: number;
  beat: number;
  id: string;
};

const removeNoteById = (state: Draft<NotesState>, noteId: string): void => {
  state.ids = state.ids.filter(id => id !== noteId);
  delete state.entities[noteId];
};

export const notesSlice = createSlice({
  name: 'notes',
  initialState: notesInitialState,
  reducers: {
    addNote(state, action: PayloadAction<AddNotePayload>) {
      const note = {
        ...action.payload,
        laneId: action.payload.laneId || action.payload.channelId || '',
      };
      delete note.channelId;
      if (!state.entities[note.id]) {
        state.ids.push(note.id);
      }
      state.entities[note.id] = note;
    },
    removeNote(state, action: PayloadAction<RemoveNotePayload>) {
      removeNoteById(state, action.payload.id);
    },
    initializeChannelNotes() {
      return undefined;
    },
    removeChannelNotes(state, action: PayloadAction<string>) {
      state.ids
        .map(id => state.entities[id])
        .filter(note => note.laneId === action.payload)
        .forEach(note => removeNoteById(state, note.id));
    },
    setNotes(state, action: PayloadAction<LegacyNotes>) {
      return normalizeNotesState(action.payload);
    },
    toggleNote: {
      reducer(state, action: PayloadAction<ToggleNotePayload>) {
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
      prepare(channelId: string, pattern: number, beat: number, id: string) {
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

type EmptyNotesChannel = {
  id: string;
  laneId?: string;
};

export const createEmptyNotesForChannels = (
  channels: EmptyNotesChannel[],
  patternCount: number,
): NotesState => normalizeNotesState(
  channels.reduce<LegacyNotes>((notes, channel) => ({
    ...notes,
    [channel.laneId || channel.id]: createPatternIds(patternCount).map(() => []),
  }), {}),
);

export const notesReducer = notesSlice.reducer;
