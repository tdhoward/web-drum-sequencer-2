import { createPatternPackMemoryOptions } from './PatternPackSelector.commands';

describe('pattern pack memory commands', () => {
  test('places export and import alongside save commands', () => {
    const options = createPatternPackMemoryOptions(true, false);

    expect(options.map(option => option.value)).toEqual([
      'SAVE_PATTERN_PACK_AS',
      'SAVE_PATTERN_PACK',
      'RENAME_PATTERN_PACK',
      'EXPORT_PATTERN_PACK',
      'IMPORT_PATTERN_PACK',
      'DELETE_PATTERN_PACK',
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

  test('allows factory pattern packs to be exported and imported', () => {
    const options = createPatternPackMemoryOptions(true, true);

    expect(options.find(option => option.value === 'SAVE_PATTERN_PACK')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'SAVE_PATTERN_PACK')?.label).toBe(
      "Save — factory pattern packs can't be overwritten",
    );
    expect(options.find(option => option.value === 'RENAME_PATTERN_PACK')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'DELETE_PATTERN_PACK')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'EXPORT_PATTERN_PACK')?.disabled).toBeUndefined();
    expect(options.find(option => option.value === 'IMPORT_PATTERN_PACK')?.disabled).toBeUndefined();
  });

  test('explains when there are no pattern pack changes to save', () => {
    const options = createPatternPackMemoryOptions(false, false);

    expect(options.find(option => option.value === 'SAVE_PATTERN_PACK')).toMatchObject({
      label: 'Save — no changes',
      disabled: true,
    });
  });
});
