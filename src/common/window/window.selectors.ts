import type { WindowState } from './window.reducer';

type WindowRootState = {
  window: WindowState;
};

export const presetPromptOpenSelector = (state: WindowRootState): boolean => (
  state.window.presetPromptOpen
);

export const flashMessageKeySelector = (state: WindowRootState): string | null => (
  state.window.flashMessageKey
);

export const flashMessageVisibleSelector = (state: WindowRootState): boolean => (
  state.window.flashMessageVisible
);

export const canInstallSelector = (state: WindowRootState): boolean => state.window.canInstall;
