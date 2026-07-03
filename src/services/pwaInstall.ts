import { setCanInstall } from '../common';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void> | void;
};

type DispatchStore = {
  dispatch: (action: unknown) => unknown;
};

let deferredPrompt: BeforeInstallPromptEvent | undefined;

export const initializePwaInstall = (store: DispatchStore): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    store.dispatch(setCanInstall(true));
  });

  window.addEventListener('appinstalled', () => {
    store.dispatch(setCanInstall(false));
  });
};

export const promptToInstall = (): void => {
  if (typeof deferredPrompt !== 'undefined') {
    deferredPrompt.prompt();
  }
};
