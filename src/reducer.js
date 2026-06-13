import { combineReducers } from '@reduxjs/toolkit';
import {
  channelsReducer,
  playbackSessionReducer,
  tempoReducer,
  masterReducer,
  notesReducer,
  presetsReducer,
  windowReducer,
  userSamplesReducer,
  songReducer,
  patternsReducer,
} from './common';

export default combineReducers({
  song: songReducer,
  patterns: patternsReducer,
  channels: channelsReducer,
  playbackSession: playbackSessionReducer,
  tempo: tempoReducer,
  master: masterReducer,
  notes: notesReducer,
  presets: presetsReducer,
  window: windowReducer,
  userSamples: userSamplesReducer,
});
