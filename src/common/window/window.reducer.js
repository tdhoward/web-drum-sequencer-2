import { createSlice } from '@reduxjs/toolkit';

export const FLASH_MESSAGES = {
  INSTALL_PWA: 'FLASH_MESSAGE_INSTALL_PWA',
  SAMPLE_LOAD_ERROR: 'SAMPLE_LOAD_ERROR',
  PRESET_SAVED: 'PRESET_SAVED',
  PRESET_DELETED: 'PRESET_DELETED',
};

export const windowInitialState = {
  presetPromptOpen: false,
  flashMessageKey: null,
  flashMessageVisible: false,
  canInstall: false,
};

export const windowSlice = createSlice({
  name: 'window',
  initialState: windowInitialState,
  reducers: {
    setPresetPrompt(state, action) {
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
    showFlashMessage(state, action) {
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
    setCanInstall(state, action) {
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
