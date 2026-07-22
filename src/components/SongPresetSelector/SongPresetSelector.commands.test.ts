import { createSongMemoryOptions } from './SongPresetSelector.commands';

describe('song memory commands', () => {
  test('places export and import alongside save commands', () => {
    const options = createSongMemoryOptions({
      hasSelectedSong: true,
      isEdited: true,
      kitEdited: false,
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
    expect(options.map(option => option.label)).toEqual([
      'Save As',
      'Save',
      'Rename',
      'Export',
      'Import',
      'Delete',
    ]);
  });

  test('keeps transfer commands available while pattern edits block saving', () => {
    const options = createSongMemoryOptions({
      hasSelectedSong: false,
      isEdited: true,
      kitEdited: false,
      patternPackEdited: true,
    });

    expect(options.find(option => option.value === 'SAVE_SONG_AS')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'SAVE_SONG_AS')?.label).toBe(
      'Save As — save the pattern pack first',
    );
    expect(options.find(option => option.value === 'SAVE_SONG')?.label).toBe(
      'Save — save the pattern pack first',
    );
    expect(options.find(option => option.value === 'RENAME_SONG')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'EXPORT_SONG')?.disabled).toBeUndefined();
    expect(options.find(option => option.value === 'IMPORT_SONG')?.disabled).toBeUndefined();
  });

  test('explains other reasons a song cannot be saved', () => {
    const newSongOptions = createSongMemoryOptions({
      hasSelectedSong: false,
      isEdited: true,
      kitEdited: false,
      patternPackEdited: false,
    });
    const unchangedSongOptions = createSongMemoryOptions({
      hasSelectedSong: true,
      isEdited: false,
      kitEdited: false,
      patternPackEdited: false,
    });

    expect(newSongOptions.find(option => option.value === 'SAVE_SONG')?.label).toBe(
      'Save — use Save As for a new song',
    );
    expect(unchangedSongOptions.find(option => option.value === 'SAVE_SONG')?.label).toBe(
      'Save — no changes',
    );
  });

  test('blocks saving until an edited kit is saved', () => {
    const options = createSongMemoryOptions({
      hasSelectedSong: true,
      isEdited: true,
      kitEdited: true,
      patternPackEdited: false,
    });

    expect(options.find(option => option.value === 'SAVE_SONG_AS')).toMatchObject({
      label: 'Save As — save the kit first',
      disabled: true,
    });
    expect(options.find(option => option.value === 'SAVE_SONG')).toMatchObject({
      label: 'Save — save the kit first',
      disabled: true,
    });
    expect(options.find(option => option.value === 'EXPORT_SONG')?.disabled).toBeUndefined();
    expect(options.find(option => option.value === 'IMPORT_SONG')?.disabled).toBeUndefined();
  });

  test('explains when both dependencies must be saved', () => {
    const options = createSongMemoryOptions({
      hasSelectedSong: true,
      isEdited: true,
      kitEdited: true,
      patternPackEdited: true,
    });

    expect(options.find(option => option.value === 'SAVE_SONG_AS')?.label).toBe(
      'Save As — save the kit and pattern pack first',
    );
    expect(options.find(option => option.value === 'SAVE_SONG')?.label).toBe(
      'Save — save the kit and pattern pack first',
    );
  });
});
