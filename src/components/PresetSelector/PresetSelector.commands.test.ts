import { createKitPresetMemoryOptions } from './PresetSelector.commands';

describe('kit preset memory commands', () => {
  test('places export and import alongside save commands', () => {
    const options = createKitPresetMemoryOptions('test808', true, false);

    expect(options.map(option => option.value)).toEqual([
      'SAVE_PRESET_AS',
      'SAVE_PRESET',
      'RENAME_PRESET',
      'EXPORT_KIT',
      'IMPORT_KIT',
      'DELETE_PRESET',
    ]);
    expect(options[2].label).toBe('Rename "test808"...');
    expect(options[3].label).toBe('Export "test808"...');
    expect(options[4].label).toBe('Import Kit...');
  });

  test('preserves save and delete restrictions for factory kits', () => {
    const options = createKitPresetMemoryOptions('808', true, true);

    expect(options.find(option => option.value === 'SAVE_PRESET')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'RENAME_PRESET')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'DELETE_PRESET')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'EXPORT_KIT')?.disabled).toBeUndefined();
    expect(options.find(option => option.value === 'IMPORT_KIT')?.disabled).toBeUndefined();
  });
});
