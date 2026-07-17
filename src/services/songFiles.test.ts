import {
  compressSongFile,
  openSongFilePicker,
  readSongFile,
  SONG_FILE_MIME_TYPE,
} from './songFiles';

describe('song files', () => {
  test('compresses and restores GZIP song contents', async () => {
    const contents = JSON.stringify({
      format: 'wds-song-bundle',
      samples: 'repeated-sample-data-'.repeat(100),
    });
    const compressed = await compressSongFile(contents);
    const bytes = new Uint8Array(await compressed.arrayBuffer());
    const file = new File([bytes], 'test.wds-song', { type: SONG_FILE_MIME_TYPE });

    expect(bytes.slice(0, 2)).toEqual(Uint8Array.from([0x1f, 0x8b]));
    await expect(readSongFile(file)).resolves.toBe(contents);
  });

  test('rejects uncompressed song files', async () => {
    const file = new File(['{}'], 'legacy.wds-song');
    await expect(readSongFile(file)).rejects.toThrow('not GZIP compressed');
  });

  test('opens a transient .wds-song picker', () => {
    const listeners: Record<string, () => void> = {};
    const selectedFile = new File(['song'], 'test.wds-song', { type: SONG_FILE_MIME_TYPE });
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
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        body: { appendChild: jest.fn() },
        createElement: jest.fn(() => input),
      },
    });
    const onSelect = jest.fn();

    try {
      openSongFilePicker(onSelect);
      expect(input.accept).toBe('.wds-song,application/gzip');
      listeners.change();
      expect(onSelect).toHaveBeenCalledWith(selectedFile);
    } finally {
      if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
      else delete (globalThis as { document?: Document }).document;
    }
  });
});
