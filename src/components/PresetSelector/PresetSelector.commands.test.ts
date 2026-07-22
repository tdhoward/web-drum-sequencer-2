import { createKitPresetMemoryOptions } from './PresetSelector.commands';

describe('kit preset memory commands', () => {
  test('places export and import alongside save commands', () => {
    const options = createKitPresetMemoryOptions(true, false);

    expect(options.map(option => option.value)).toEqual([
      'SAVE_PRESET_AS',
      'SAVE_PRESET',
      'RENAME_PRESET',
      'EXPORT_KIT',
      'IMPORT_KIT',
      'DELETE_PRESET',
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

  test('preserves save and delete restrictions for factory kits', () => {
    const options = createKitPresetMemoryOptions(true, true);

    expect(options.find(option => option.value === 'SAVE_PRESET')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'SAVE_PRESET')?.label).toBe(
      "Save — factory kits can't be overwritten",
    );
    expect(options.find(option => option.value === 'RENAME_PRESET')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'DELETE_PRESET')?.disabled).toBe(true);
    expect(options.find(option => option.value === 'EXPORT_KIT')?.disabled).toBeUndefined();
    expect(options.find(option => option.value === 'IMPORT_KIT')?.disabled).toBeUndefined();
  });

  test('explains when there are no kit changes to save', () => {
    const options = createKitPresetMemoryOptions(false, false);

    expect(options.find(option => option.value === 'SAVE_PRESET')).toMatchObject({
      label: 'Save — no changes',
      disabled: true,
    });
  });
});
