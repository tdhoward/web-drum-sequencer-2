import { connect } from 'react-redux';
import {
  arrangementIndexSelector,
  arrangementPatternIdsSelector,
  clearArrangementPattern,
  patternsSelector,
  playbackModeSelector,
  playingSelector,
  PLAYBACK_MODES,
  removeArrangementColumn,
  reorderArrangementColumn,
  setArrangementPattern,
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
    isSongPlaying: playingSelector(state) && playbackModeSelector(state) === PLAYBACK_MODES.SONG,
    patterns: patterns.ids.map((id, index) => ({
      id,
      name: patterns.entities[id]?.name || `Pattern ${index + 1}`,
    })),
  };
};

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  onSelectCell: (columnIndex: number, patternId: string, selected: boolean) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
    dispatch(selected
      ? clearArrangementPattern({ columnIndex, patternId })
      : setArrangementPattern({ columnIndex, patternId }));
  },
  onDeleteColumn: (columnIndex: number) => {
    if (!window.confirm(`Delete song column ${columnIndex + 1}?`)) {
      return;
    }

    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
    dispatch(removeArrangementColumn(columnIndex));
  },
  onReorderColumn: (oldIndex: number, newIndex: number) => {
    stopAllNotes();
    clearScheduledNotes();
    dispatch(stopPlayback());
    dispatch(reorderArrangementColumn({ oldIndex, newIndex }));
  },
});

export const SongSequencer = connect(mapStateToProps, mapDispatchToProps)(SongSequencerComponent);
