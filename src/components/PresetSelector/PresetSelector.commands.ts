import type { PresetSelectorCommand } from './PresetSelector.component';

export type KitPresetCommand =
  | 'SAVE_PRESET_AS'
  | 'SAVE_PRESET'
  | 'RENAME_PRESET'
  | 'EXPORT_KIT'
  | 'IMPORT_KIT'
  | 'DELETE_PRESET';

export const createKitPresetMemoryOptions = (
  isEdited: boolean,
  defaultPresetSelected: boolean,
): PresetSelectorCommand<KitPresetCommand>[] => [
  {
    label: 'Save As',
    value: 'SAVE_PRESET_AS',
  },
  {
    label: defaultPresetSelected
      ? "Save — factory kits can't be overwritten"
      : isEdited ? 'Save' : 'Save — no changes',
    value: 'SAVE_PRESET',
    disabled: !isEdited || defaultPresetSelected,
  },
  {
    label: 'Rename',
    value: 'RENAME_PRESET',
    disabled: defaultPresetSelected,
  },
  {
    label: 'Export',
    value: 'EXPORT_KIT',
  },
  {
    label: 'Import',
    value: 'IMPORT_KIT',
  },
  {
    label: 'Delete',
    value: 'DELETE_PRESET',
    disabled: defaultPresetSelected,
  },
];
