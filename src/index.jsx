import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from './components/App';
import { initializeAudio } from './services/audioLoop';
import { store, persistor } from './store';
import { channelsSelector, loadSampleStatefully } from './common';
import { startAnimations } from './services/animations';
import { initializePwaInstall } from './services/pwaInstall';
import { initializeDB } from './services/database';

window.addEventListener('online', () => {
  const channels = channelsSelector(store.getState());

  channels.forEach((channel) => {
    if (!channel.sampleLoaded) {
      loadSampleStatefully(store.dispatch, channel);
    }
  });
});

const root = createRoot(document.getElementById('root'));

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
    const channels = channelsSelector(store.getState());

    channels.forEach((channel) => {
      loadSampleStatefully(store.dispatch, channel);
    });
  });

if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (error) {
    console.warn('Service worker registration failed:', error);
  }
}