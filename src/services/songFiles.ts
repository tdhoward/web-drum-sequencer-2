import {
  GZIP_MIME_TYPE,
  compressGzipText,
  downloadGzipText,
  openFilePicker,
  readGzipText,
} from './gzipFiles';

export const SONG_FILE_EXTENSION = '.wds-song';
export const SONG_FILE_MIME_TYPE = GZIP_MIME_TYPE;

const safeFileStem = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'song';
};

export const songFileName = (songName: string): string => (
  `${safeFileStem(songName)}${SONG_FILE_EXTENSION}`
);

export const openSongFilePicker = (onSelect: (file: File) => void): void => {
  openFilePicker(`${SONG_FILE_EXTENSION},${SONG_FILE_MIME_TYPE}`, onSelect);
};

export const compressSongFile = (contents: string): Promise<Blob> => (
  compressGzipText(contents, SONG_FILE_MIME_TYPE)
);

export const downloadSongFile = async (
  contents: string,
  fileName: string,
): Promise<void> => {
  await downloadGzipText(contents, fileName, SONG_FILE_MIME_TYPE);
};

export const readSongFile = (file: File): Promise<string> => readGzipText(file, {
  read: 'Unable to read song file',
  uncompressed: 'Song file is not GZIP compressed',
  decompression: 'Song file could not be decompressed',
});
