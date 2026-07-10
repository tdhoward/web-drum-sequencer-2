import { createStructuredSelector, createSelector } from 'reselect';
import {
  presetSelector,
  userPresetsSelector,
  presetPromptOpenSelector,
  currentKitPresetStateSelector,
} from '../../common';
import { deepEqual, omitFields } from '../../common/presetMemory';
import type { UserPreset } from '../../common';
import presets from '../../presets';

type PresetOption = (typeof presets)[number] | UserPreset;

const presetMetadataFields = new Set(['name', 'bpm', 'swing', 'notes']);

// presetSelector returns the preset name - this will get the whole preset object
const currentPresetSelector = createSelector(
  presetSelector,
  userPresetsSelector,
  (presetName, userPresets): PresetOption | undefined => [...presets, ...(userPresets || [])].find(
    preset => preset.name === presetName,
  ),
);

// Indicates if the preset is a "stock" preset or has been modified by user (not saved)
const isEditedSelector = createSelector(
  currentPresetSelector,
  currentKitPresetStateSelector,
  (preset, currentState): boolean => !deepEqual(omitFields(preset, presetMetadataFields), currentState),
);

export const presetSelectorSelectors = createStructuredSelector({
  isEdited: isEditedSelector,
  currentPreset: currentPresetSelector,
  userPresets: userPresetsSelector,
  currentState: currentKitPresetStateSelector,
  presetPromptOpen: presetPromptOpenSelector,
});
