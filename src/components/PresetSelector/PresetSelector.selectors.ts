import { createStructuredSelector, createSelector } from 'reselect';
import {
  presetSelector,
  userPresetsSelector,
  presetPromptOpenSelector,
  currentKitPresetStateSelector,
} from '../../common';
import type { UserPreset } from '../../common';
import presets from '../../presets';

type PresetOption = (typeof presets)[number] | UserPreset;

const presetMetadataFields = new Set(['name', 'bpm', 'swing', 'notes']);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
);

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => deepEqual(item, right[index]));
  }

  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) {
      return false;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(key => (
      Object.prototype.hasOwnProperty.call(right, key)
        && deepEqual(left[key], right[key])
    ));
  }

  return false;
};

const omitPresetMetadata = (
  preset: PresetOption | undefined,
): Record<string, unknown> | undefined => {
  if (!preset) {
    return undefined;
  }

  return Object.entries(preset).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    if (!presetMetadataFields.has(key)) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
};

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
  (preset, currentState): boolean => !deepEqual(omitPresetMetadata(preset), currentState),
);

export const presetSelectorSelectors = createStructuredSelector({
  isEdited: isEditedSelector,
  currentPreset: currentPresetSelector,
  userPresets: userPresetsSelector,
  currentState: currentKitPresetStateSelector,
  presetPromptOpen: presetPromptOpenSelector,
});
