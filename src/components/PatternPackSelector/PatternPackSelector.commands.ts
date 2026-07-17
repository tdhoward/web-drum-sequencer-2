import type { PresetSelectorCommand } from '../PresetSelector/PresetSelector.component';

export type PatternPackCommand =
  | 'SAVE_PATTERN_PACK_AS'
  | 'SAVE_PATTERN_PACK'
  | 'EXPORT_PATTERN_PACK'
  | 'IMPORT_PATTERN_PACK'
  | 'DELETE_PATTERN_PACK';

export const createPatternPackMemoryOptions = (
  selectedPatternPackName: string,
  isEdited: boolean,
  defaultPatternPackSelected: boolean,
): PresetSelectorCommand<PatternPackCommand>[] => [
  {
    label: 'Save Pattern Pack As...',
    value: 'SAVE_PATTERN_PACK_AS',
  },
  {
    label: `Save "${selectedPatternPackName}"`,
    value: 'SAVE_PATTERN_PACK',
    disabled: !isEdited || defaultPatternPackSelected,
  },
  {
    label: `Export "${selectedPatternPackName}"...`,
    value: 'EXPORT_PATTERN_PACK',
  },
  {
    label: 'Import Pattern Pack...',
    value: 'IMPORT_PATTERN_PACK',
  },
  {
    label: `Delete "${selectedPatternPackName}"`,
    value: 'DELETE_PATTERN_PACK',
    disabled: defaultPatternPackSelected,
  },
];
