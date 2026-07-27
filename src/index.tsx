import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from './components/App';
import { initializeAudio } from './services/audioLoop';
import { store, persistor } from './store';
import {
  getUserSampleId,
  loadCurrentKitSamples,
  setSampleFingerprint,
  setUserSampleFingerprint,
  userSamplesSelector,
} from './common';
import { startAnimations } from './services/animations';
import { initializePwaInstall } from './services/pwaInstall';
import { initializeDB } from './services/database';
import { ensureSampleFingerprint } from './services/sampleStore';

type LegacyDispatch = (action: unknown) => unknown;

const dispatchLegacyAction = store.dispatch as LegacyDispatch;

const waitForPersistedState = (): Promise<void> => new Promise((resolve) => {
  if (persistor.getState().bootstrapped) {
    resolve();
    return;
  }

  const unsubscribe = persistor.subscribe(() => {
    if (persistor.getState().bootstrapped) {
      unsubscribe();
      resolve();
    }
  });
});

const samplePersistenceReady = Promise.all([
  initializeDB(),
  waitForPersistedState(),
]);

window.addEventListener('online', () => {
  samplePersistenceReady.then(() => {
    dispatchLegacyAction(loadCurrentKitSamples());
  });
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Unable to mount app: #root element was not found.');
}

const root = createRoot(rootElement);

root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
);

initializeAudio(store);

startAnimations(store);

initializePwaInstall(store);

samplePersistenceReady
  .then(() => {
    // sampleStore is memory-only after a refresh, so rebuild it even though
    // reusable sample metadata remains persisted.
    dispatchLegacyAction(loadCurrentKitSamples({ force: true }));

    const userSamples = userSamplesSelector(store.getState()) || [];
    userSamples.forEach((userSample) => {
      const sampleId = getUserSampleId(userSample);
      ensureSampleFingerprint(sampleId).then((fingerprint) => {
        dispatchLegacyAction(setUserSampleFingerprint(sampleId, fingerprint));
        dispatchLegacyAction(setSampleFingerprint(sampleId, fingerprint));
      }).catch(() => {
        // Missing legacy payloads remain available for the normal sample-load error path.
      });
    });
  });

if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (error) {
    console.warn('Service worker registration failed:', error);
  }
}
