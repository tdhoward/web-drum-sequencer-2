import { createPatternPackMemoryOptions } from './PatternPackSelector.commands';

describe('pattern pack memory commands', () => {
  test('places export and import alongside save commands', () => {
    const options = createPatternPackMemoryOptions('Travel Beats', true, false);

    expect(options.map(option => option.value)).toEqual([
      'SAVE_PATTERN_PACK_AS',
      'SAVE_PATTERN_PACK',
      'EXPORT_PATTERN_PACK',
      'IMPORT_PATTERN_PACK',
      'DELETE_PATTERN_PACK',
    ]);
    expect(options[2].label).toBe('Export "Travel Beats"...');
    expect(options[3].label).toBe('Import Pattern Pack...');
  });

  test('allows factory pattern packs to be exported and imported', () => {
    const options = createPatternPackMemoryOptions('Hip Hop Swing', true, true);

    expect(options.find(option => option.value === 'SAVE_PATTERN_PACK')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'DELETE_PATTERN_PACK')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'EXPORT_PATTERN_PACK')?.disabled).toBeUndefined();
    expect(options.find(option => option.value === 'IMPORT_PATTERN_PACK')?.disabled).toBeUndefined();
  });
});
