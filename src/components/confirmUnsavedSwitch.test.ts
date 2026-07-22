import { confirmUnsavedSwitch } from './confirmUnsavedSwitch';

describe('confirmUnsavedSwitch', () => {
  const confirm = jest.fn<boolean, [string]>();

  beforeEach(() => {
    confirm.mockReset();
  });

  test('allows a switch without prompting when nothing is edited', () => {
    expect(confirmUnsavedSwitch([], confirm)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  test('returns the user choice for one edited item', () => {
    confirm.mockReturnValue(false);

    expect(confirmUnsavedSwitch(['kit'], confirm)).toBe(false);
    expect(confirm).toHaveBeenCalledWith(
      'You have unsaved changes to the current kit. '
      + 'Switching away will discard those changes. Continue?',
    );
  });

  test('names every edited item in a combined warning', () => {
    confirm.mockReturnValue(true);

    expect(confirmUnsavedSwitch(['kit', 'pattern pack', 'song'], confirm)).toBe(true);
    expect(confirm).toHaveBeenCalledWith(
      'You have unsaved changes to the current kit, pattern pack, and song. '
      + 'Switching away will discard those changes. Continue?',
    );
  });
});
