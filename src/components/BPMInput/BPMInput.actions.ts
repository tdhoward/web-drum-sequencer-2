import {
  arrangementPatternIdsSelector,
  activeTempoColumnSelector,
  playbackModeSelector,
  playingSelector,
  PLAYBACK_MODES,
  selectedSongTempoColumnSelector,
  selectedWorkspaceSelector,
  setBPM,
  setActiveSongBpm,
  setSelectedSongTempoColumn,
  setSongTempo,
  WORKSPACES,
} from '../../common';
import { getAudioContext } from '../../services/audioContext';
import { cancelScheduledNotesAfter } from '../../services/audioScheduler';

type TempoActionState = Parameters<typeof arrangementPatternIdsSelector>[0]
  & Parameters<typeof selectedWorkspaceSelector>[0]
  & Parameters<typeof playingSelector>[0];

type Dispatch = (action: unknown) => void;

export const setWorkspaceBPM = (bpm: number) => (
  dispatch: Dispatch,
  getState: () => TempoActionState,
): void => {
  if (!Number.isFinite(bpm) || bpm <= 0) return;

  const state = getState();
  if (playingSelector(state) && playbackModeSelector(state) === PLAYBACK_MODES.SONG) {
    const columnCount = arrangementPatternIdsSelector(state).length;
    const columnIndex = activeTempoColumnSelector(state);
    if (columnIndex < columnCount) {
      cancelScheduledNotesAfter(getAudioContext().currentTime);
      dispatch(setSongTempo({ columnIndex, bpm }));
      dispatch(setSelectedSongTempoColumn(columnIndex));
      dispatch(setActiveSongBpm(bpm));
    }
    dispatch(setBPM(bpm));
    return;
  }

  if (!playingSelector(state) && selectedWorkspaceSelector(state) === WORKSPACES.SONG) {
    const columnCount = arrangementPatternIdsSelector(state).length;
    const columnIndex = selectedSongTempoColumnSelector(state);
    if (columnIndex < columnCount) {
      dispatch(setSongTempo({ columnIndex, bpm }));
    }
  }

  dispatch(setBPM(bpm));
};
