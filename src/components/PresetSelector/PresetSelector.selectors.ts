import { createStructuredSelector, createSelector } from 'reselect';
import {
  presetSelector,
  userPresetsSelector,
  presetPromptOpenSelector,
  currentKitPresetStateSelector,
  normalizeKitPresetState,
} from '../../common';
import { deepEqual } from '../../common/presetMemory';
import type { KitPresetStateInput, UserPreset } from '../../common';
import presets from '../../presets';

type PresetOption = (typeof presets)[number] | UserPreset;

// presetSelector returns the preset name - this will get the whole preset object
const currentPresetSelector = createSelector(
  presetSelector,
  userPresetsSelector,
  (presetName, userPresets): PresetOption | undefined => [...presets, ...(userPresets || [])].find(
    preset => preset.name === presetName,
  ),
);

// Indicates if the preset is a "stock" preset or has been modified by user (not saved)
export const isCurrentKitEditedSelector = createSelector(
  currentPresetSelector,
  currentKitPresetStateSelector,
  (preset, currentState): boolean => !deepEqual(
    normalizeKitPresetState(preset as KitPresetStateInput | undefined),
    currentState,
  ),
);

export const presetSelectorSelectors = createStructuredSelector({
  isEdited: isCurrentKitEditedSelector,
  currentPreset: currentPresetSelector,
  userPresets: userPresetsSelector,
  currentState: currentKitPresetStateSelector,
  presetPromptOpen: presetPromptOpenSelector,
});
