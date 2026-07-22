import type { PresetSelectorCommand } from '../PresetSelector/PresetSelector.component';

export type SongPresetCommand =
  | 'SAVE_SONG_AS'
  | 'SAVE_SONG'
  | 'RENAME_SONG'
  | 'EXPORT_SONG'
  | 'IMPORT_SONG'
  | 'DELETE_SONG';

const dependencySaveReason = (
  kitEdited: boolean,
  patternPackEdited: boolean,
): string | undefined => {
  if (kitEdited && patternPackEdited) return 'save the kit and pattern pack first';
  if (kitEdited) return 'save the kit first';
  if (patternPackEdited) return 'save the pattern pack first';
  return undefined;
};

export const createSongMemoryOptions = ({
  hasSelectedSong,
  isEdited,
  kitEdited,
  patternPackEdited,
}: {
  hasSelectedSong: boolean;
  isEdited: boolean;
  kitEdited: boolean;
  patternPackEdited: boolean;
}): PresetSelectorCommand<SongPresetCommand>[] => {
  const dependencyReason = dependencySaveReason(kitEdited, patternPackEdited);

  return [
    {
      label: dependencyReason ? `Save As — ${dependencyReason}` : 'Save As',
      value: 'SAVE_SONG_AS',
      disabled: Boolean(dependencyReason),
    },
    {
      label: dependencyReason
        ? `Save — ${dependencyReason}`
        : !hasSelectedSong
          ? 'Save — use Save As for a new song'
          : isEdited ? 'Save' : 'Save — no changes',
      value: 'SAVE_SONG',
      disabled: Boolean(dependencyReason) || !hasSelectedSong || !isEdited,
    },
    {
      label: 'Rename',
      value: 'RENAME_SONG',
      disabled: !hasSelectedSong,
    },
    {
      label: 'Export',
      value: 'EXPORT_SONG',
    },
    {
      label: 'Import',
      value: 'IMPORT_SONG',
    },
    {
      label: 'Delete',
      value: 'DELETE_SONG',
      disabled: !hasSelectedSong,
    },
  ];
};
