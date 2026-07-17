import type { WindowState } from './window.reducer';

type WindowRootState = {
  window: WindowState;
};

export const presetPromptOpenSelector = (state: WindowRootState): boolean => (
  state.window.presetPromptOpen
);

export const presetRenamePromptSelector = (state: WindowRootState): boolean => (
  state.window.presetRenamePrompt || false
);

export const patternPackPromptOpenSelector = (state: WindowRootState): boolean => (
  state.window.patternPackPromptOpen
);

export const patternPackRenamePromptSelector = (state: WindowRootState): boolean => (
  state.window.patternPackRenamePrompt || false
);

export const songPromptOpenSelector = (state: WindowRootState): boolean => state.window.songPromptOpen;

export const songRenamePromptSelector = (state: WindowRootState): boolean => (
  state.window.songRenamePrompt || false
);

export const flashMessageKeySelector = (state: WindowRootState): string | null => (
  state.window.flashMessageKey
);

export const flashMessageVisibleSelector = (state: WindowRootState): boolean => (
  state.window.flashMessageVisible
);

export const canInstallSelector = (state: WindowRootState): boolean => state.window.canInstall;
