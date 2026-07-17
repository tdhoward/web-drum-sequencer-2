import type { PresetSelectorCommand } from '../PresetSelector/PresetSelector.component';

export type SongPresetCommand =
  | 'SAVE_SONG_AS'
  | 'SAVE_SONG'
  | 'EXPORT_SONG'
  | 'IMPORT_SONG'
  | 'DELETE_SONG';

export const createSongMemoryOptions = ({
  songName,
  hasSelectedSong,
  isEdited,
  patternPackEdited,
}: {
  songName: string;
  hasSelectedSong: boolean;
  isEdited: boolean;
  patternPackEdited: boolean;
}): PresetSelectorCommand<SongPresetCommand>[] => [
  {
    label: patternPackEdited ? 'Save Pattern Pack Before Saving Song' : 'Save Song As...',
    value: 'SAVE_SONG_AS',
    disabled: patternPackEdited,
  },
  {
    label: `Save "${songName}"`,
    value: 'SAVE_SONG',
    disabled: patternPackEdited || !hasSelectedSong || !isEdited,
  },
  {
    label: `Export "${songName}"...`,
    value: 'EXPORT_SONG',
  },
  {
    label: 'Import Song...',
    value: 'IMPORT_SONG',
  },
  {
    label: `Delete "${songName}"`,
    value: 'DELETE_SONG',
    disabled: !hasSelectedSong,
  },
];
