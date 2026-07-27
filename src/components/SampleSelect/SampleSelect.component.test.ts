import {
  CHOOSE_FILE_VALUE,
  RECORD_SAMPLE_VALUE,
  factorySampleOptions,
  getSampleDisplayName,
  getSampleSelectOptions,
} from './SampleSelect.component';

jest.mock('../../services/audioRouter', () => ({
  playNote: jest.fn(),
  stopAllNotes: jest.fn(),
}));

describe('reusable sample picker options', () => {
  test('omits creation commands when the picker targets an editor draft', () => {
    const groups = getSampleSelectOptions([
      { value: 'user-snare.wav', label: 'Ghost Snare' },
    ], false);
    const values = groups.flatMap(group => group.options.map(option => option.value));

    expect(values).toContain('user-snare.wav');
    expect(values).not.toContain(CHOOSE_FILE_VALUE);
    expect(values).not.toContain(RECORD_SAMPLE_VALUE);
  });

  test('retains upload and recording commands for the connected Kit-row picker', () => {
    const groups = getSampleSelectOptions([], true);
    const values = groups.flatMap(group => group.options.map(option => option.value));

    expect(values).toContain(CHOOSE_FILE_VALUE);
    expect(values).toContain(RECORD_SAMPLE_VALUE);
  });

  test('resolves visible names for user and factory samples', () => {
    const factorySample = factorySampleOptions[0];

    expect(getSampleDisplayName(
      'user-snare.wav',
      [{ id: 'user-snare.wav', name: 'Ghost Snare' }],
    )).toBe('Ghost Snare');
    expect(getSampleDisplayName(factorySample.value, [])).toBe(factorySample.label);
  });
});
