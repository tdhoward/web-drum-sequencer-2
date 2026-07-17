import {
  GZIP_MIME_TYPE,
  compressGzipText,
  downloadGzipText,
  openFilePicker,
  readGzipText,
} from './gzipFiles';

export const KIT_FILE_EXTENSION = '.wds-kit';
export const KIT_FILE_MIME_TYPE = GZIP_MIME_TYPE;

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
  openFilePicker(`${KIT_FILE_EXTENSION},${KIT_FILE_MIME_TYPE}`, onSelect);
};

export const compressKitFile = (contents: string): Promise<Blob> => (
  compressGzipText(contents, KIT_FILE_MIME_TYPE)
);

export const downloadKitFile = async (contents: string, fileName: string): Promise<void> => {
  await downloadGzipText(contents, fileName, KIT_FILE_MIME_TYPE);
};

export const readKitFile = (file: File): Promise<string> => readGzipText(file, {
  read: 'Unable to read kit file',
  uncompressed: 'Kit file is not GZIP compressed',
  decompression: 'Kit file could not be decompressed',
});
