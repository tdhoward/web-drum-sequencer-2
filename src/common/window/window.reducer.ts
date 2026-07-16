import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const FLASH_MESSAGES = {
  INSTALL_PWA: 'FLASH_MESSAGE_INSTALL_PWA',
  SAMPLE_LOAD_ERROR: 'SAMPLE_LOAD_ERROR',
  PRESET_SAVED: 'PRESET_SAVED',
  PRESET_DELETED: 'PRESET_DELETED',
  PATTERN_PACK_SAVED: 'PATTERN_PACK_SAVED',
  PATTERN_PACK_DELETED: 'PATTERN_PACK_DELETED',
  PATTERN_PACK_EXPORTED: 'PATTERN_PACK_EXPORTED',
  PATTERN_PACK_IMPORTED: 'PATTERN_PACK_IMPORTED',
  PATTERN_PACK_TRANSFER_ERROR: 'PATTERN_PACK_TRANSFER_ERROR',
  SONG_SAVED: 'SONG_SAVED',
  SONG_DELETED: 'SONG_DELETED',
  KIT_EXPORTED: 'KIT_EXPORTED',
  KIT_IMPORTED: 'KIT_IMPORTED',
  KIT_TRANSFER_ERROR: 'KIT_TRANSFER_ERROR',
} as const;

export type FlashMessageKey = typeof FLASH_MESSAGES[keyof typeof FLASH_MESSAGES] | string;

export type WindowState = {
  presetPromptOpen: boolean;
  patternPackPromptOpen: boolean;
  songPromptOpen: boolean;
  flashMessageKey: FlashMessageKey | null;
  flashMessageVisible: boolean;
  canInstall: boolean;
};

export const windowInitialState: WindowState = {
  presetPromptOpen: false,
  patternPackPromptOpen: false,
  songPromptOpen: false,
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
    setPatternPackPrompt(state, action: PayloadAction<boolean>) {
      state.patternPackPromptOpen = action.payload;
    },
    setSongPrompt(state, action: PayloadAction<boolean>) {
      state.songPromptOpen = action.payload;
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
  setPatternPackPrompt,
  setSongPrompt,
  setPresetNameField,
  showFlashMessage,
  clearFlashMessage,
  setCanInstall,
} = windowSlice.actions;

export const windowReducer = windowSlice.reducer;
