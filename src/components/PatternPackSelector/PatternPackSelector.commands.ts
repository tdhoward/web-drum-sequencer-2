import type { PresetSelectorCommand } from '../PresetSelector/PresetSelector.component';

export type PatternPackCommand =
  | 'SAVE_PATTERN_PACK_AS'
  | 'SAVE_PATTERN_PACK'
  | 'RENAME_PATTERN_PACK'
  | 'EXPORT_PATTERN_PACK'
  | 'IMPORT_PATTERN_PACK'
  | 'DELETE_PATTERN_PACK';

export const createPatternPackMemoryOptions = (
  isEdited: boolean,
  defaultPatternPackSelected: boolean,
): PresetSelectorCommand<PatternPackCommand>[] => [
  {
    label: 'Save As',
    value: 'SAVE_PATTERN_PACK_AS',
  },
  {
    label: defaultPatternPackSelected
      ? "Save — factory pattern packs can't be overwritten"
      : isEdited ? 'Save' : 'Save — no changes',
    value: 'SAVE_PATTERN_PACK',
    disabled: !isEdited || defaultPatternPackSelected,
  },
  {
    label: 'Rename',
    value: 'RENAME_PATTERN_PACK',
    disabled: defaultPatternPackSelected,
  },
  {
    label: 'Export',
    value: 'EXPORT_PATTERN_PACK',
  },
  {
    label: 'Import',
    value: 'IMPORT_PATTERN_PACK',
  },
  {
    label: 'Delete',
    value: 'DELETE_PATTERN_PACK',
    disabled: defaultPatternPackSelected,
  },
];
