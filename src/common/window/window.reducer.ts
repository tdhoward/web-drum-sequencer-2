import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const FLASH_MESSAGES = {
  INSTALL_PWA: 'FLASH_MESSAGE_INSTALL_PWA',
  SAMPLE_LOAD_ERROR: 'SAMPLE_LOAD_ERROR',
  PRESET_SAVED: 'PRESET_SAVED',
  PRESET_DELETED: 'PRESET_DELETED',
} as const;

export type FlashMessageKey = typeof FLASH_MESSAGES[keyof typeof FLASH_MESSAGES] | string;

export type WindowState = {
  presetPromptOpen: boolean;
  flashMessageKey: FlashMessageKey | null;
  flashMessageVisible: boolean;
  canInstall: boolean;
};

export const windowInitialState: WindowState = {
  presetPromptOpen: false,
  flashMessageKey: null,
  flashMessageVisible: false,
  canInstall: false,
};

export const windowSlice = createSlice({
  name: 'window',
  initialState: windowInitialState,
  reducers: {
    setPresetPrompt(state, action: PayloadAction<boolean>) {
      state.presetPromptOpen = action.payload;
    },
    setPresetNameField: {
      reducer() {
        // Preserved as a no-op because the legacy action existed without reducer state.
      },
      prepare() {
        return { payload: undefined };
      },
    },
    showFlashMessage(state, action: PayloadAction<FlashMessageKey>) {
      state.flashMessageKey = action.payload;
      state.flashMessageVisible = true;
    },
    clearFlashMessage: {
      reducer(state) {
        state.flashMessageVisible = false;
      },
      prepare() {
        return { payload: undefined };
      },
    },
    setCanInstall(state, action: PayloadAction<boolean>) {
      state.canInstall = action.payload;
    },
  },
});

export const {
  setPresetPrompt,
  setPresetNameField,
  showFlashMessage,
  clearFlashMessage,
  setCanInstall,
} = windowSlice.actions;

export const windowReducer = windowSlice.reducer;
