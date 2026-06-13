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
  samplesReducer,
} from './common';

export default combineReducers({
  song: songReducer,
  kits: kitsReducer,
  kitChannels: channelsReducer,
  samples: samplesReducer,
  patterns: patternsReducer,
  playbackSession: playbackSessionReducer,
  tempo: tempoReducer,
  master: masterReducer,
  notes: notesReducer,
  presets: presetsReducer,
  window: windowReducer,
  userSamples: userSamplesReducer,
});
