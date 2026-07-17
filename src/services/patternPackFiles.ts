import {
  GZIP_MIME_TYPE,
  compressGzipText,
  downloadGzipText,
  openFilePicker,
  readGzipText,
} from './gzipFiles';

export const PATTERN_PACK_FILE_EXTENSION = '.wds-pattern-pack';
export const PATTERN_PACK_FILE_MIME_TYPE = GZIP_MIME_TYPE;

const safeFileStem = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'pattern-pack';
};

export const patternPackFileName = (patternPackName: string): string => (
  `${safeFileStem(patternPackName)}${PATTERN_PACK_FILE_EXTENSION}`
);

export const openPatternPackFilePicker = (onSelect: (file: File) => void): void => {
  openFilePicker(
    `${PATTERN_PACK_FILE_EXTENSION},${PATTERN_PACK_FILE_MIME_TYPE}`,
    onSelect,
  );
};

export const compressPatternPackFile = (contents: string): Promise<Blob> => (
  compressGzipText(contents, PATTERN_PACK_FILE_MIME_TYPE)
);

export const downloadPatternPackFile = async (
  contents: string,
  fileName: string,
): Promise<void> => {
  await downloadGzipText(contents, fileName, PATTERN_PACK_FILE_MIME_TYPE);
};

export const readPatternPackFile = (file: File): Promise<string> => readGzipText(file, {
  read: 'Unable to read pattern pack file',
  uncompressed: 'Pattern pack file is not GZIP compressed',
  decompression: 'Pattern pack file could not be decompressed',
});
