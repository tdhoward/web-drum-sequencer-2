import { combineReducers } from '@reduxjs/toolkit';
import {
  playbackSessionReducer,
  tempoReducer,
  masterReducer,
  notesReducer,
  presetsReducer,
  windowReducer,
  userSamplesReducer,
  songReducer,
  patternsReducer,
  kitsReducer,
  channelsReducer,
  kitChannelAssignmentsReducer,
  samplesReducer,
  patternPacksReducer,
  workspaceReducer,
  uiPreferencesReducer,
  songLibraryReducer,
} from './common';

const rootReducer = combineReducers({
  song: songReducer,
  songLibrary: songLibraryReducer,
  kits: kitsReducer,
  kitChannels: channelsReducer,
  kitChannelAssignments: kitChannelAssignmentsReducer,
  samples: samplesReducer,
  patternPacks: patternPacksReducer,
  uiPreferences: uiPreferencesReducer,
  patterns: patternsReducer,
  playbackSession: playbackSessionReducer,
  tempo: tempoReducer,
  master: masterReducer,
  notes: notesReducer,
  presets: presetsReducer,
  window: windowReducer,
  userSamples: userSamplesReducer,
  workspace: workspaceReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
