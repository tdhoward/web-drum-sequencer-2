import { connect } from 'react-redux';
import {
  arrangementIndexSelector,
  arrangementPatternIdsSelector,
  bpmSelector,
  clearArrangementPattern,
  patternsSelector,
  playbackModeSelector,
  playingSelector,
  PLAYBACK_MODES,
  removeArrangementColumn,
  reorderArrangementColumn,
  setArrangementPattern,
  setSelectedSongTempoColumn,
  selectedSongTempoColumnSelector,
  songTempoChangesSelector,
  stopPlayback,
} from '../../common';
import { stopAllNotes } from '../../services/audioRouter';
import { clearScheduledNotes } from '../../services/audioScheduler';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';
import { SongSequencerComponent } from './SongSequencer.component';

const mapStateToProps = (state: RootState) => {
  const patterns = patternsSelector(state);
  return {
    arrangementPatternIds: arrangementPatternIdsSelector(state),
    arrangementIndex: arrangementIndexSelector(state),
    fallbackBpm: bpmSelector(state),
    isSongPlaying: playingSelector(state) && playbackModeSelector(state) === PLAYBACK_MODES.SONG,
    selectedTempoColumn: selectedSongTempoColumnSelector(state),
    tempoChanges: songTempoChangesSelector(state),
    patterns: patterns.ids.map((id, index) => ({
      id,
      name: patterns.entities[id]?.name || `Pattern ${index + 1}`,
    })),
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  onSelectCell: (
    columnIndex: number,
    patternId: string,
    selected: boolean,
    fallbackBpm: number,
  ) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
    dispatch(selected
      ? clearArrangementPattern({ columnIndex, patternId })
      : setArrangementPattern({ columnIndex, patternId, bpm: fallbackBpm }));
  },
  onSelectTempo: (columnIndex: number) => dispatch(setSelectedSongTempoColumn(columnIndex)),
  onDeleteColumn: (columnIndex: number, selectedTempoColumn: number) => {
    if (!window.confirm(`Delete song column ${columnIndex + 1}?`)) {
      return;
    }

    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
    dispatch(removeArrangementColumn(columnIndex));
    if (selectedTempoColumn >= columnIndex) {
      dispatch(setSelectedSongTempoColumn(Math.max(0, selectedTempoColumn - 1)));
    }
  },
  onReorderColumn: (
    oldIndex: number,
    newIndex: number,
    selectedTempoColumn: number,
    fallbackBpm: number,
  ) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
    dispatch(reorderArrangementColumn({ oldIndex, newIndex, bpm: fallbackBpm }));
    if (selectedTempoColumn === oldIndex) {
      dispatch(setSelectedSongTempoColumn(newIndex));
    } else if (oldIndex < selectedTempoColumn && newIndex >= selectedTempoColumn) {
      dispatch(setSelectedSongTempoColumn(selectedTempoColumn - 1));
    } else if (oldIndex > selectedTempoColumn && newIndex <= selectedTempoColumn) {
      dispatch(setSelectedSongTempoColumn(selectedTempoColumn + 1));
    }
  },
});

export const SongSequencer = connect(mapStateToProps, mapDispatchToProps)(SongSequencerComponent);
