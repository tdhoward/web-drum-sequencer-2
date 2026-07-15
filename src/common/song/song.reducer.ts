import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  getEffectiveSongBpm,
  normalizeArrangementPatternIds,
  normalizeTempoChanges,
  patternIndexToId,
} from '../sequencerModel';
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
    setArrangementPattern(state, action: PayloadAction<{
      columnIndex: number;
      patternId: string;
      bpm?: number;
    }>) {
      const { columnIndex, patternId, bpm = 120 } = action.payload;
      if (!state.patternIds.includes(patternId) || columnIndex < 0) {
        return;
      }
      const arrangement = state.arrangementPatternIds || (state.arrangementPatternIds = []);
      if (columnIndex === arrangement.length) {
        arrangement.push([patternId]);
        const tempoChanges = state.tempoChanges || (state.tempoChanges = []);
        tempoChanges.push(columnIndex === 0 ? bpm : null);
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
        const nextColumnBpm = getEffectiveSongBpm(
          state.tempoChanges,
          Math.min(action.payload + 1, arrangement.length - 1),
          120,
        );
        arrangement.splice(action.payload, 1);
        const tempoChanges = normalizeTempoChanges(
          state.tempoChanges,
          arrangement.length + 1,
          nextColumnBpm,
        );
        tempoChanges.splice(action.payload, 1);
        if (tempoChanges.length > 0 && tempoChanges[0] === null) {
          tempoChanges[0] = nextColumnBpm;
        }
        state.tempoChanges = tempoChanges;
      }
    },
    reorderArrangementColumn(
      state,
      action: PayloadAction<{ oldIndex: number; newIndex: number; bpm?: number }>,
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

      const tempoChanges = normalizeTempoChanges(
        state.tempoChanges,
        arrangement.length,
        action.payload.bpm ?? 120,
      );
      const columns = arrangement.map((patternIds, index) => ({
        patternIds,
        tempoChange: tempoChanges[index],
        effectiveBpm: getEffectiveSongBpm(tempoChanges, index, action.payload.bpm ?? 120),
        pending: false,
      }));
      columns.push({
        patternIds: [] as string[],
        tempoChange: null,
        effectiveBpm: action.payload.bpm ?? 120,
        pending: true,
      });
      const [movedColumn] = columns.splice(oldIndex, 1);
      columns.splice(newIndex, 0, movedColumn);

      const pendingIndex = columns.findIndex(column => column.pending);
      const persistedColumns = pendingIndex === columns.length - 1
        ? columns.slice(0, -1)
        : columns;
      state.arrangementPatternIds = persistedColumns.map(column => column.patternIds);
      state.tempoChanges = persistedColumns.map((column, index) => (
        index === 0 ? (column.tempoChange ?? column.effectiveBpm) : column.tempoChange
      ));
    },
    setSongTempo(state, action: PayloadAction<{ columnIndex: number; bpm: number }>) {
      const { columnIndex, bpm } = action.payload;
      const columnCount = state.arrangementPatternIds?.length || 0;
      if (columnIndex < 0 || columnIndex >= columnCount || !Number.isFinite(bpm) || bpm <= 0) {
        return;
      }

      const tempoChanges = normalizeTempoChanges(state.tempoChanges, columnCount, bpm);
      const precedingBpm = getEffectiveSongBpm(tempoChanges, columnIndex - 1, bpm);
      tempoChanges[columnIndex] = columnIndex > 0 && bpm === precedingBpm ? null : bpm;
      state.tempoChanges = tempoChanges;
    },
    loadSong(state, action: PayloadAction<{
      id: string;
      name: string;
      selectedKitId?: string;
      patternPackId: string;
      arrangementPatternIds: string[][];
      tempoChanges?: Array<number | null>;
      fallbackBpm?: number;
    }>) {
      state.id = action.payload.id;
      state.name = action.payload.name;
      if (action.payload.selectedKitId) {
        state.selectedKitId = action.payload.selectedKitId;
      }
      state.patternPackId = action.payload.patternPackId;
      state.arrangementPatternIds = normalizeArrangementPatternIds(
        action.payload.arrangementPatternIds,
      ).map(column => column.filter(patternId => state.patternIds.includes(patternId)));
      state.tempoChanges = normalizeTempoChanges(
        action.payload.tempoChanges,
        state.arrangementPatternIds.length,
        action.payload.fallbackBpm ?? 120,
      );
    },
    clearSongArrangement(state) {
      state.arrangementPatternIds = [];
      state.tempoChanges = [];
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
  setSongTempo,
  loadSong,
  clearSongArrangement,
} = songSlice.actions;

export const songReducer = songSlice.reducer;
