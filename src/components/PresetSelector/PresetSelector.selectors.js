import { createStructuredSelector, createSelector } from 'reselect';
import * as R from 'ramda';
import {
  presetSelector,
  userPresetsSelector,
  presetPromptOpenSelector,
  currentKitPresetStateSelector,
} from '../../common';
import presets from '../../presets';

// presetSelector returns the preset name - this will get the whole preset object
const currentPresetSelector = createSelector(
  presetSelector,
  userPresetsSelector,
  (presetName, userPresets) => [...presets, ...userPresets].find(
    preset => preset.name === presetName,
  ),
);

// Indicates if the preset is a "stock" preset or has been modified by user (not saved)
const isEditedSelector = createSelector(
  currentPresetSelector,
  currentKitPresetStateSelector,
  (preset, currentState) => !R.equals(
    R.omit(['name', 'bpm', 'swing', 'notes'], preset),
    currentState,
  ),
);

export const presetSelectorSelectors = createStructuredSelector({
  isEdited: isEditedSelector,
  currentPreset: currentPresetSelector,
  userPresets: userPresetsSelector,
  currentState: currentKitPresetStateSelector,
  presetPromptOpen: presetPromptOpenSelector,
});
