import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import type { MigrationManifest } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducer';
import type { RootState } from './reducer';
import {
  migrateToKitSequencerState,
  migrateToNormalizedSequencerState,
  normalizeArrangementPatternIds,
} from './common/sequencerModel';
import type { LegacySequencerState } from './common/sequencerModel';
import presets from './presets';

export const migrations = {
  1: () => ({}),
  2: () => ({}),
  3: () => ({}),
  4: (state: LegacySequencerState = {}) => (
    migrateToNormalizedSequencerState(state, presets[1])
  ),
  5: (state: LegacySequencerState = {}) => (
    migrateToKitSequencerState(state, presets[1])
  ),
  6: (state: LegacySequencerState = {}) => ({
    ...state,
    song: state.song
      ? {
        ...state.song,
        arrangementPatternIds: state.song.arrangementPatternIds || [],
        patternPackId: state.song.patternPackId
          || (state.patternPacks as { selectedPatternPackId?: string } | undefined)?.selectedPatternPackId,
      }
      : state.song,
  }),
  7: (state: LegacySequencerState = {}) => ({
    ...state,
    song: state.song
      ? {
        ...state.song,
        arrangementPatternIds: normalizeArrangementPatternIds(
          state.song.arrangementPatternIds,
        ),
      }
      : state.song,
    songLibrary: state.songLibrary
      ? {
        ...(state.songLibrary as object),
        userSongs: ((state.songLibrary as { userSongs?: Array<Record<string, unknown>> })
          .userSongs || []).map(song => ({
          ...song,
          arrangementPatternIds: normalizeArrangementPatternIds(song.arrangementPatternIds),
        })),
      }
      : state.songLibrary,
  }),
};

const persistConfig = {
  key: 'root',
  version: 7,
  storage,
  blacklist: ['playbackSession', 'window', 'workspace'],
  migrate: createMigrate(migrations as unknown as MigrationManifest, { debug: import.meta.env.DEV }),
};

const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.DEV,
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
