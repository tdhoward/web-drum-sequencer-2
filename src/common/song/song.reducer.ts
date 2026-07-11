import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { patternIndexToId } from '../sequencerModel';
import { createDefaultSongState } from '../defaultSequencerState';

export const songInitialState = createDefaultSongState();

export const songSlice = createSlice({
  name: 'song',
  initialState: songInitialState,
  reducers: {
    setPattern(state, action: PayloadAction<number>) {
      state.selectedPatternId = patternIndexToId(action.payload);
    },
    setSelectedPatternId(state, action: PayloadAction<string>) {
      state.selectedPatternId = action.payload;
    },
    setSongName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setSelectedKitId(state, action: PayloadAction<string>) {
      state.selectedKitId = action.payload;
    },
    setSongPatternPackId(state, action: PayloadAction<string>) {
      state.patternPackId = action.payload;
    },
    setArrangementPattern(state, action: PayloadAction<{ columnIndex: number; patternId: string }>) {
      const { columnIndex, patternId } = action.payload;
      if (!state.patternIds.includes(patternId) || columnIndex < 0) {
        return;
      }
      const arrangement = state.arrangementPatternIds || (state.arrangementPatternIds = []);
      if (columnIndex === arrangement.length) {
        arrangement.push(patternId);
      } else if (columnIndex < arrangement.length) {
        arrangement[columnIndex] = patternId;
      }
    },
    clearArrangementPattern(state, action: PayloadAction<number>) {
      const arrangement = state.arrangementPatternIds || [];
      if (action.payload >= 0 && action.payload < arrangement.length) {
        arrangement[action.payload] = null;
      }
    },
    removeArrangementColumn(state, action: PayloadAction<number>) {
      const arrangement = state.arrangementPatternIds || [];
      if (action.payload >= 0 && action.payload < arrangement.length) {
        arrangement.splice(action.payload, 1);
      }
    },
    loadSong(state, action: PayloadAction<{
      id: string;
      name: string;
      patternPackId: string;
      arrangementPatternIds: Array<string | null>;
    }>) {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.patternPackId = action.payload.patternPackId;
      state.arrangementPatternIds = action.payload.arrangementPatternIds.map(
        patternId => (patternId === null || state.patternIds.includes(patternId) ? patternId : null),
      );
    },
    clearSongArrangement(state) {
      state.arrangementPatternIds = [];
    },
  },
});

export const {
  setPattern,
  setSelectedPatternId,
  setSongName,
  setSelectedKitId,
  setSongPatternPackId,
  setArrangementPattern,
  clearArrangementPattern,
  removeArrangementColumn,
  loadSong,
  clearSongArrangement,
} = songSlice.actions;

export const songReducer = songSlice.reducer;
