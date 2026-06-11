import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistReducer, createMigrate } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducer';

const migrations = {
  1: () => ({}),
  2: () => ({}),
  3: () => ({}),
};

const persistConfig = {
  key: 'root',
  version: 3,
  storage,
  blacklist: ['playbackSession', 'window'],
  migrate: createMigrate(migrations, { debug: import.meta.env.DEV }),
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, composeEnhancers(applyMiddleware(thunk)));
export const persistor = persistStore(store);
