import { connect } from 'react-redux';
import {
  arrangementIndexSelector,
  arrangementPatternIdsSelector,
  patternsSelector,
  playbackModeSelector,
  playingSelector,
  PLAYBACK_MODES,
  removeArrangementColumn,
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
      ? removeArrangementColumn(columnIndex)
      : setArrangementPattern({ columnIndex, patternId }));
  },
});

export const SongSequencer = connect(mapStateToProps, mapDispatchToProps)(SongSequencerComponent);
