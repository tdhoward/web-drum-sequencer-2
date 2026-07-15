import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from './components/App';
import { initializeAudio } from './services/audioLoop';
import { store, persistor } from './store';
import {
  channelsSelector,
  getUserSampleId,
  loadSampleStatefully,
  setSampleFingerprint,
  setUserSampleFingerprint,
  userSamplesSelector,
} from './common';
import { startAnimations } from './services/animations';
import { initializePwaInstall } from './services/pwaInstall';
import { initializeDB } from './services/database';
import type { LegacyChannel } from './common';
import { ensureSampleFingerprint } from './services/sampleStore';

type LegacyDispatch = (action: unknown) => unknown;

const dispatchLegacyAction = store.dispatch as LegacyDispatch;

const getChannels = () => channelsSelector(
  store.getState() as unknown as Parameters<typeof channelsSelector>[0],
);

type LoadChannelSampleOptions = {
  force?: boolean;
};

type LegacyChannelWithSample = LegacyChannel & {
  sample: string;
};

const hasSample = (channel: LegacyChannel): channel is LegacyChannelWithSample => (
  typeof channel.sample === 'string' && channel.sample.length > 0
);

const loadChannelSample = (
  channel: LegacyChannel,
  { force = false }: LoadChannelSampleOptions = {},
): void => {
  if (!hasSample(channel)) {
    return;
  }

  if (force || !channel.sampleLoaded) {
    loadSampleStatefully(dispatchLegacyAction, channel);
  }
};

window.addEventListener('online', () => {
  const channels = getChannels();

  channels.forEach(channel => loadChannelSample(channel));
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

initializeDB()
  .then(() => {
    const channels = getChannels();

    // Redux can persist sampleLoaded=true, but sampleStore is memory-only after a refresh.
    channels.forEach(channel => loadChannelSample(channel, { force: true }));

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
