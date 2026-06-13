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
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducer';
import {
  migrateToKitSequencerState,
  migrateToNormalizedSequencerState,
} from './common/sequencerModel';
import presets from './presets';

export const migrations = {
  1: () => ({}),
  2: () => ({}),
  3: () => ({}),
  4: state => migrateToNormalizedSequencerState(state, presets[1]),
  5: state => migrateToKitSequencerState(state, presets[1]),
};

const persistConfig = {
  key: 'root',
  version: 5,
  storage,
  blacklist: ['playbackSession', 'window', 'workspace'],
  migrate: createMigrate(migrations, { debug: import.meta.env.DEV }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.DEV,
  middleware: getDefaultMiddleware => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});

export const persistor = persistStore(store);
