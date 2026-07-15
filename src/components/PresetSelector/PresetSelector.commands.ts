import type { PresetSelectorCommand } from './PresetSelector.component';

export type KitPresetCommand =
  | 'SAVE_PRESET_AS'
  | 'SAVE_PRESET'
  | 'EXPORT_KIT'
  | 'IMPORT_KIT'
  | 'DELETE_PRESET';

export const createKitPresetMemoryOptions = (
  selectedPresetName: string,
  isEdited: boolean,
  defaultPresetSelected: boolean,
): PresetSelectorCommand<KitPresetCommand>[] => [
  {
    label: 'Save Kit As...',
    value: 'SAVE_PRESET_AS',
  },
  {
    label: `Save "${selectedPresetName}"`,
    value: 'SAVE_PRESET',
    disabled: !isEdited || defaultPresetSelected,
  },
  {
    label: `Export "${selectedPresetName}"...`,
    value: 'EXPORT_KIT',
  },
  {
    label: 'Import Kit...',
    value: 'IMPORT_KIT',
  },
  {
    label: `Delete "${selectedPresetName}"`,
    value: 'DELETE_PRESET',
    disabled: defaultPresetSelected,
  },
];
