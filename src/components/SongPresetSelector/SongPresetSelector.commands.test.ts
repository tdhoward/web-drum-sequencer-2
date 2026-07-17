import { createSongMemoryOptions } from './SongPresetSelector.commands';

describe('song memory commands', () => {
  test('places export and import alongside save commands', () => {
    const options = createSongMemoryOptions({
      songName: 'Travel Song',
      hasSelectedSong: true,
      isEdited: true,
      patternPackEdited: false,
    });

    expect(options.map(option => option.value)).toEqual([
      'SAVE_SONG_AS',
      'SAVE_SONG',
      'RENAME_SONG',
      'EXPORT_SONG',
      'IMPORT_SONG',
      'DELETE_SONG',
    ]);
    expect(options[2].label).toBe('Rename "Travel Song"...');
    expect(options[3].label).toBe('Export "Travel Song"...');
    expect(options[4].label).toBe('Import Song...');
  });

  test('keeps transfer commands available while pattern edits block saving', () => {
    const options = createSongMemoryOptions({
      songName: 'Edited Song',
      hasSelectedSong: false,
      isEdited: true,
      patternPackEdited: true,
    });

    expect(options.find(option => option.value === 'SAVE_SONG_AS')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'RENAME_SONG')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'EXPORT_SONG')?.disabled).toBeUndefined();
    expect(options.find(option => option.value === 'IMPORT_SONG')?.disabled).toBeUndefined();
  });
});
