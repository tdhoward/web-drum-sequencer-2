export const GZIP_MIME_TYPE = 'application/gzip';

type GzipReadErrors = {
  read: string;
  uncompressed: string;
  decompression: string;
};

export const openFilePicker = (
  accept: string,
  onSelect: (file: File) => void,
): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
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

export const compressGzipText = async (
  contents: string,
  mimeType = GZIP_MIME_TYPE,
): Promise<Blob> => {
  const GzipStream = requireCompressionStream();
  const compressedStream = new Blob([contents])
    .stream()
    .pipeThrough(new GzipStream('gzip'));
  const compressedBytes = await new Response(compressedStream).arrayBuffer();
  return new Blob([compressedBytes], { type: mimeType });
};

export const downloadGzipText = async (
  contents: string,
  fileName: string,
  mimeType = GZIP_MIME_TYPE,
): Promise<void> => {
  const blob = await compressGzipText(contents, mimeType);
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

const readFileBytes = (file: File, errorMessage: string): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(errorMessage));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error(errorMessage));
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const readGzipText = async (
  file: File,
  errors: GzipReadErrors,
): Promise<string> => {
  const compressedBytes = await readFileBytes(file, errors.read);
  const header = new Uint8Array(compressedBytes, 0, Math.min(2, compressedBytes.byteLength));
  if (header[0] !== 0x1f || header[1] !== 0x8b) {
    throw new Error(errors.uncompressed);
  }

  const GunzipStream = requireDecompressionStream();
  try {
    const decompressedStream = new Blob([compressedBytes])
      .stream()
      .pipeThrough(new GunzipStream('gzip'));
    return await new Response(decompressedStream).text();
  } catch {
    throw new Error(errors.decompression);
  }
};
