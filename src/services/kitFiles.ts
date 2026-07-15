export const KIT_FILE_EXTENSION = '.wds-kit';
export const KIT_FILE_MIME_TYPE = 'application/gzip';

const safeFileStem = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'drum-kit';
};

export const kitFileName = (kitName: string): string => (
  `${safeFileStem(kitName)}${KIT_FILE_EXTENSION}`
);

export const openKitFilePicker = (onSelect: (file: File) => void): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = `${KIT_FILE_EXTENSION},${KIT_FILE_MIME_TYPE}`;
  input.style.display = 'none';
  const removeInput = () => input.remove();
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    removeInput();
    if (file) onSelect(file);
  }, { once: true });
  input.addEventListener('cancel', removeInput, { once: true });
  document.body.appendChild(input);
  input.click();
};

const requireCompressionStream = (): typeof CompressionStream => {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('This browser does not support GZIP compression');
  }
  return CompressionStream;
};

const requireDecompressionStream = (): typeof DecompressionStream => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support GZIP decompression');
  }
  return DecompressionStream;
};

export const compressKitFile = async (contents: string): Promise<Blob> => {
  const GzipStream = requireCompressionStream();
  const compressedStream = new Blob([contents])
    .stream()
    .pipeThrough(new GzipStream('gzip'));
  const compressedBytes = await new Response(compressedStream).arrayBuffer();
  return new Blob([compressedBytes], { type: KIT_FILE_MIME_TYPE });
};

export const downloadKitFile = async (contents: string, fileName: string): Promise<void> => {
  const blob = await compressKitFile(contents);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const readFileBytes = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read kit file'));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read kit file'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const readKitFile = async (file: File): Promise<string> => {
  const compressedBytes = await readFileBytes(file);
  const header = new Uint8Array(compressedBytes, 0, Math.min(2, compressedBytes.byteLength));
  if (header[0] !== 0x1f || header[1] !== 0x8b) {
    throw new Error('Kit file is not GZIP compressed');
  }

  const GunzipStream = requireDecompressionStream();
  try {
    const decompressedStream = new Blob([compressedBytes])
      .stream()
      .pipeThrough(new GunzipStream('gzip'));
    return await new Response(decompressedStream).text();
  } catch {
    throw new Error('Kit file could not be decompressed');
  }
};
