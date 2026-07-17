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
  SONG_EXPORTED: 'SONG_EXPORTED',
  SONG_IMPORTED: 'SONG_IMPORTED',
  SONG_TRANSFER_ERROR: 'SONG_TRANSFER_ERROR',
  KIT_EXPORTED: 'KIT_EXPORTED',
  KIT_IMPORTED: 'KIT_IMPORTED',
  KIT_TRANSFER_ERROR: 'KIT_TRANSFER_ERROR',
} as const;

export type FlashMessageKey = typeof FLASH_MESSAGES[keyof typeof FLASH_MESSAGES] | string;

export type WindowState = {
  presetPromptOpen: boolean;
  presetRenamePrompt: boolean;
  patternPackPromptOpen: boolean;
  patternPackRenamePrompt: boolean;
  songPromptOpen: boolean;
  songRenamePrompt: boolean;
  flashMessageKey: FlashMessageKey | null;
  flashMessageVisible: boolean;
  canInstall: boolean;
};

export const windowInitialState: WindowState = {
  presetPromptOpen: false,
  presetRenamePrompt: false,
  patternPackPromptOpen: false,
  patternPackRenamePrompt: false,
  songPromptOpen: false,
  songRenamePrompt: false,
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
      if (!action.payload) state.presetRenamePrompt = false;
    },
    setPresetRenamePrompt(state, action: PayloadAction<boolean>) {
      state.presetPromptOpen = action.payload;
      state.presetRenamePrompt = action.payload;
    },
    setPatternPackPrompt(state, action: PayloadAction<boolean>) {
      state.patternPackPromptOpen = action.payload;
      if (!action.payload) state.patternPackRenamePrompt = false;
    },
    setPatternPackRenamePrompt(state, action: PayloadAction<boolean>) {
      state.patternPackPromptOpen = action.payload;
      state.patternPackRenamePrompt = action.payload;
    },
    setSongPrompt(state, action: PayloadAction<boolean>) {
      state.songPromptOpen = action.payload;
      if (!action.payload) state.songRenamePrompt = false;
    },
    setSongRenamePrompt(state, action: PayloadAction<boolean>) {
      state.songPromptOpen = action.payload;
      state.songRenamePrompt = action.payload;
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
  setPresetRenamePrompt,
  setPatternPackPrompt,
  setPatternPackRenamePrompt,
  setSongPrompt,
  setSongRenamePrompt,
  setPresetNameField,
  showFlashMessage,
  clearFlashMessage,
  setCanInstall,
} = windowSlice.actions;

export const windowReducer = windowSlice.reducer;
