import { createStructuredSelector } from 'reselect';
import {
  presetPromptOpenSelector,
  presetRenamePromptSelector,
  presetSelector,
  currentStateSelector,
  userPresetsSelector,
} from '../../common';

export const savePresetModalSelectors = createStructuredSelector({
  userPresets: userPresetsSelector,
  presetPromptOpen: presetPromptOpenSelector,
  renamePrompt: presetRenamePromptSelector,
  selectedPresetName: presetSelector,
  currentState: currentStateSelector,
});
