import {
  compressKitFile,
  KIT_FILE_MIME_TYPE,
  openKitFilePicker,
  readKitFile,
} from './kitFiles';

describe('kit files', () => {
  test('compresses and restores GZIP kit contents', async () => {
    const contents = JSON.stringify({
      format: 'wds-kit-bundle',
      samples: 'repeated-sample-data-'.repeat(100),
    });
    const compressed = await compressKitFile(contents);
    const bytes = new Uint8Array(await compressed.arrayBuffer());
    const file = new File([bytes], 'test.wds-kit', { type: KIT_FILE_MIME_TYPE });

    expect(compressed.type).toBe('application/gzip');
    expect(bytes[0]).toBe(0x1f);
    expect(bytes[1]).toBe(0x8b);
    expect(compressed.size).toBeLessThan(new TextEncoder().encode(contents).byteLength);
    await expect(readKitFile(file)).resolves.toBe(contents);
  });

  test('rejects uncompressed kit files', async () => {
    const file = new File(['{"format":"wds-kit-bundle"}'], 'legacy.wds-kit');

    await expect(readKitFile(file)).rejects.toThrow('not GZIP compressed');
  });

  test('rejects invalid GZIP data', async () => {
    const file = new File([
      Uint8Array.from([0x1f, 0x8b, 0x00, 0x01, 0x02, 0x03]),
    ], 'invalid.wds-kit', { type: KIT_FILE_MIME_TYPE });

    await expect(readKitFile(file)).rejects.toThrow('could not be decompressed');
  });

  test('opens a transient .wds-kit picker and returns the selected file', () => {
    const listeners: Record<string, () => void> = {};
    const selectedFile = new File(['kit'], 'test808.wds-kit', { type: KIT_FILE_MIME_TYPE });
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
      openKitFilePicker(onSelect);
      expect(input.type).toBe('file');
      expect(input.accept).toBe('.wds-kit,application/gzip');
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
