import {
  compressPatternPackFile,
  openPatternPackFilePicker,
  PATTERN_PACK_FILE_MIME_TYPE,
  patternPackFileName,
  readPatternPackFile,
} from './patternPackFiles';

describe('pattern pack files', () => {
  test('compresses and restores GZIP pattern pack contents', async () => {
    const contents = JSON.stringify({
      format: 'wds-pattern-pack-bundle',
      notes: 'repeated-pattern-data-'.repeat(100),
    });
    const compressed = await compressPatternPackFile(contents);
    const bytes = new Uint8Array(await compressed.arrayBuffer());
    const file = new File([bytes], 'test.wds-pattern-pack', {
      type: PATTERN_PACK_FILE_MIME_TYPE,
    });

    expect(compressed.type).toBe('application/gzip');
    expect(bytes[0]).toBe(0x1f);
    expect(bytes[1]).toBe(0x8b);
    await expect(readPatternPackFile(file)).resolves.toBe(contents);
  });

  test('rejects uncompressed and invalid GZIP files', async () => {
    const uncompressed = new File(['{}'], 'legacy.wds-pattern-pack');
    const invalid = new File([
      Uint8Array.from([0x1f, 0x8b, 0x00, 0x01]),
    ], 'invalid.wds-pattern-pack', { type: PATTERN_PACK_FILE_MIME_TYPE });

    await expect(readPatternPackFile(uncompressed)).rejects.toThrow('not GZIP compressed');
    await expect(readPatternPackFile(invalid)).rejects.toThrow('could not be decompressed');
  });

  test('creates safe filenames', () => {
    expect(patternPackFileName(' Hip Hop / Swing! ')).toBe(
      'hip-hop-swing.wds-pattern-pack',
    );
  });

  test('opens a transient pattern pack picker and returns the selected file', () => {
    const listeners: Record<string, () => void> = {};
    const selectedFile = new File(['pack'], 'beats.wds-pattern-pack');
    const input = {
      accept: '',
      files: [selectedFile],
      style: { display: '' },
      type: '',
      addEventListener: jest.fn((event: string, listener: () => void) => {
        listeners[event] = listener;
      }),
      click: jest.fn(),
      remove: jest.fn(),
    };
    const appendChild = jest.fn();
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        body: { appendChild },
        createElement: jest.fn(() => input),
      },
    });
    const onSelect = jest.fn();

    try {
      openPatternPackFilePicker(onSelect);
      expect(input.type).toBe('file');
      expect(input.accept).toBe('.wds-pattern-pack,application/gzip');
      expect(appendChild).toHaveBeenCalledWith(input);
      expect(input.click).toHaveBeenCalled();

      listeners.change();
      expect(onSelect).toHaveBeenCalledWith(selectedFile);
      expect(input.remove).toHaveBeenCalled();
    } finally {
      if (originalDocument) {
        Object.defineProperty(globalThis, 'document', originalDocument);
      } else {
        delete (globalThis as { document?: Document }).document;
      }
    }
  });
});
