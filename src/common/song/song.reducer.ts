import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { normalizeArrangementPatternIds, patternIndexToId } from '../sequencerModel';
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
        arrangement.push([patternId]);
      } else if (columnIndex < arrangement.length) {
        const column = arrangement[columnIndex];
        if (!column.includes(patternId)) {
          column.push(patternId);
        }
      }
    },
    clearArrangementPattern(
      state,
      action: PayloadAction<{ columnIndex: number; patternId: string }>,
    ) {
      const { columnIndex, patternId } = action.payload;
      const arrangement = state.arrangementPatternIds || [];
      if (columnIndex >= 0 && columnIndex < arrangement.length) {
        arrangement[columnIndex] = arrangement[columnIndex].filter(id => id !== patternId);
      }
    },
    removeArrangementColumn(state, action: PayloadAction<number>) {
      const arrangement = state.arrangementPatternIds || [];
      if (action.payload >= 0 && action.payload < arrangement.length) {
        arrangement.splice(action.payload, 1);
      }
    },
    reorderArrangementColumn(
      state,
      action: PayloadAction<{ oldIndex: number; newIndex: number }>,
    ) {
      const { oldIndex, newIndex } = action.payload;
      const arrangement = state.arrangementPatternIds || [];
      const pendingColumnIndex = arrangement.length;
      if (
        oldIndex < 0
        || oldIndex > pendingColumnIndex
        || newIndex < 0
        || newIndex > pendingColumnIndex
        || oldIndex === newIndex
      ) {
        return;
      }

      const columns = arrangement.map(patternIds => ({ patternIds, pending: false }));
      columns.push({ patternIds: [] as string[], pending: true });
      const [movedColumn] = columns.splice(oldIndex, 1);
      columns.splice(newIndex, 0, movedColumn);

      const pendingIndex = columns.findIndex(column => column.pending);
      const persistedColumns = pendingIndex === columns.length - 1
        ? columns.slice(0, -1)
        : columns;
      state.arrangementPatternIds = persistedColumns.map(column => column.patternIds);
    },
    loadSong(state, action: PayloadAction<{
      id: string;
      name: string;
      patternPackId: string;
      arrangementPatternIds: string[][];
    }>) {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.patternPackId = action.payload.patternPackId;
      state.arrangementPatternIds = normalizeArrangementPatternIds(
        action.payload.arrangementPatternIds,
      ).map(column => column.filter(patternId => state.patternIds.includes(patternId)));
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
  reorderArrangementColumn,
  loadSong,
  clearSongArrangement,
} = songSlice.actions;

export const songReducer = songSlice.reducer;
