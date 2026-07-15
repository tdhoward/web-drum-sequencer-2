import { createSelector } from 'reselect';
import {
  activeBpmSelector,
  arrangementIndexSelector,
  arrangementPatternIdsSelector,
  bpmSelector,
  playbackModeSelector,
  PLAYBACK_MODES,
  playingSelector,
  patternsSelector,
  selectedPatternIdSelector,
  selectedSongTempoColumnSelector,
  selectedWorkspaceSelector,
  songTempoChangesSelector,
  songOccurrenceStartTimeSelector,
  startTimeSelector,
  WORKSPACES,
} from '../../common';
import {
  getBarLengthInQuarterBeats,
  getEffectiveSongBpm,
} from '../../common/sequencerModel';

export const bpmInputSelectors = createSelector(
  bpmSelector,
  playingSelector,
  startTimeSelector,
  playbackModeSelector,
  activeBpmSelector,
  arrangementIndexSelector,
  songOccurrenceStartTimeSelector,
  selectedWorkspaceSelector,
  selectedSongTempoColumnSelector,
  songTempoChangesSelector,
  patternsSelector,
  selectedPatternIdSelector,
  arrangementPatternIdsSelector,
  (
    bpm,
    playing,
    startTime,
    playbackMode,
    activeBpm,
    arrangementIndex,
    songOccurrenceStartTime,
    workspace,
    selectedTempoColumn,
    tempoChanges,
    patterns,
    selectedPatternId,
    arrangementPatternIds,
  ) => {
    const songPlaying = playing && playbackMode === PLAYBACK_MODES.SONG;
    const songPatternIds = arrangementPatternIds[arrangementIndex] || [];
    const pulsePatternId = songPlaying
      ? songPatternIds.includes(selectedPatternId)
        ? selectedPatternId
        : songPatternIds.find(patternId => Boolean(patterns.entities[patternId]))
      : selectedPatternId;
    return {
      bpm: songPlaying
        ? activeBpm ?? getEffectiveSongBpm(tempoChanges, arrangementIndex, bpm)
        : workspace === WORKSPACES.SONG && !playing && tempoChanges.length > 0
          ? getEffectiveSongBpm(tempoChanges, selectedTempoColumn, bpm)
          : bpm,
      playing,
      startTime: songPlaying ? songOccurrenceStartTime ?? startTime : startTime,
      barLengthInBeats: getBarLengthInQuarterBeats(
        pulsePatternId ? patterns.entities[pulsePatternId] : undefined,
      ),
    };
  },
);
