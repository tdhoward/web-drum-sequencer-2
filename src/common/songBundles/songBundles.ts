import {
  calculatePatternPackContentHash,
  calculateSongContentHash,
  contentHashIndexKey,
  createContentHashIndex,
  hasCurrentContentHash,
} from '../contentHash';
import {
  assertDrumkitSnapshotShape,
  createDrumkitSnapshot,
  verifyDrumkitSnapshot,
} from '../kitBundles';
import type { DrumkitSnapshot } from '../kitBundles';
import type {
  ContentHashMetadata,
  Kit,
  KitChannel,
  PatternPack,
  Sample,
  SavedSong,
} from '../sequencerModel';
import {
  assertPatternPackShape,
  preparePatternPackForExport,
} from '../patternPackBundles';
import {
  parseBinaryPayloads,
  serializeBinaryPayloads,
} from '../bundlePayloads';

export const SONG_BUNDLE_FORMAT = 'wds-song-bundle' as const;
export const SONG_BUNDLE_VERSION = 1;

export type { DrumkitSnapshot, ExportedSample } from '../kitBundles';

export type SongBundleManifest = {
  format: typeof SONG_BUNDLE_FORMAT;
  version: typeof SONG_BUNDLE_VERSION;
  song: SavedSong & Required<ContentHashMetadata>;
  drumkit: DrumkitSnapshot;
  patternPack: PatternPack & Required<ContentHashMetadata>;
};

export type SongExportBundle = {
  manifest: SongBundleManifest;
  samplePayloads: Record<string, ArrayBuffer>;
};

export type CreateSongExportBundleInput = {
  song: SavedSong;
  kit: Kit;
  channels: KitChannel[];
  samples: Record<string, Sample>;
  patternPack: PatternPack;
  includedLaneIds?: string[];
  getSampleBytes: (sample: Sample) => Promise<ArrayBuffer>;
};

export const createSongExportBundle = async ({
  song,
  kit,
  channels,
  samples,
  patternPack,
  includedLaneIds,
  getSampleBytes,
}: CreateSongExportBundleInput): Promise<SongExportBundle> => {
  const { drumkit, samplePayloads, kitHash } = await createDrumkitSnapshot({
    kit,
    channels,
    samples,
    getSampleBytes,
  });
  const portablePatternPack = preparePatternPackForExport(patternPack, includedLaneIds);
  const patternPackHash = await calculatePatternPackContentHash(portablePatternPack);
  const exportedPatternPack = { ...portablePatternPack, ...patternPackHash };
  const songForExport: SavedSong = {
    ...song,
    selectedKitId: kit.id,
    patternPackId: patternPack.id,
    kitContentHash: kitHash.contentHash,
    patternPackContentHash: patternPackHash.contentHash,
  };
  const songHash = await calculateSongContentHash({
    song: songForExport,
    kitContentHash: kitHash.contentHash,
    patternPack: exportedPatternPack,
    patternPackContentHash: patternPackHash.contentHash,
  });

  return {
    manifest: {
      format: SONG_BUNDLE_FORMAT,
      version: SONG_BUNDLE_VERSION,
      song: { ...songForExport, ...songHash },
      drumkit,
      patternPack: exportedPatternPack,
    },
    samplePayloads,
  };
};

const assertMatchingHash = (
  label: string,
  stored: Partial<ContentHashMetadata>,
  calculated: ContentHashMetadata,
): void => {
  if (!hasCurrentContentHash(stored) || stored.contentHash !== calculated.contentHash) {
    throw new Error(`${label} content hash verification failed`);
  }
};

export type VerifiedSongBundle = {
  sampleHashes: Record<string, ContentHashMetadata & { byteLength: number }>;
  kitHash: ContentHashMetadata;
  patternPackHash: ContentHashMetadata;
  songHash: ContentHashMetadata;
};

export const verifySongExportBundle = async (
  bundle: SongExportBundle,
): Promise<VerifiedSongBundle> => {
  const { manifest } = bundle;
  if (manifest.format !== SONG_BUNDLE_FORMAT || manifest.version !== SONG_BUNDLE_VERSION) {
    throw new Error('Unsupported song bundle format or version');
  }

  const { sampleHashes, kitHash } = await verifyDrumkitSnapshot(
    manifest.drumkit,
    bundle.samplePayloads,
  );

  const patternPackHash = await calculatePatternPackContentHash(manifest.patternPack);
  assertMatchingHash('Pattern pack', manifest.patternPack, patternPackHash);

  if (manifest.song.kitContentHash !== kitHash.contentHash) {
    throw new Error('Song drumkit dependency hash verification failed');
  }
  if (manifest.song.patternPackContentHash !== patternPackHash.contentHash) {
    throw new Error('Song pattern-pack dependency hash verification failed');
  }
  const songHash = await calculateSongContentHash({
    song: manifest.song,
    kitContentHash: kitHash.contentHash,
    patternPack: manifest.patternPack,
    patternPackContentHash: patternPackHash.contentHash,
  });
  assertMatchingHash('Song', manifest.song, songHash);

  return { sampleHashes, kitHash, patternPackHash, songHash };
};

export type ExistingContentLibraries = {
  kits: Kit[];
  patternPacks: PatternPack[];
  songs: SavedSong[];
};

export type SongImportResolution = VerifiedSongBundle & {
  selectedKitId: string;
  patternPackId: string;
  duplicateKit?: Kit;
  duplicatePatternPack?: PatternPack;
  duplicateSong?: SavedSong;
  resolvedSong: SavedSong;
};

export const resolveSongBundleImport = async (
  bundle: SongExportBundle,
  libraries: ExistingContentLibraries,
): Promise<SongImportResolution> => {
  const verified = await verifySongExportBundle(bundle);
  const duplicateKit = createContentHashIndex(libraries.kits).get(
    contentHashIndexKey(verified.kitHash),
  );
  const duplicatePatternPack = createContentHashIndex(libraries.patternPacks).get(
    contentHashIndexKey(verified.patternPackHash),
  );
  const duplicateSong = createContentHashIndex(libraries.songs).get(
    contentHashIndexKey(verified.songHash),
  );
  const selectedKitId = duplicateKit?.id || bundle.manifest.drumkit.kit.id;
  const patternPackId = duplicatePatternPack?.id || bundle.manifest.patternPack.id;

  return {
    ...verified,
    selectedKitId,
    patternPackId,
    duplicateKit,
    duplicatePatternPack,
    duplicateSong,
    resolvedSong: {
      ...bundle.manifest.song,
      selectedKitId,
      patternPackId,
    },
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isStringArray = (value: unknown): value is string[] => (
  Array.isArray(value) && value.every(item => typeof item === 'string')
);

const assertSavedSongShape: (value: unknown) => asserts value is SavedSong = (value) => {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || typeof value.selectedKitId !== 'string'
    || typeof value.patternPackId !== 'string'
    || !Array.isArray(value.arrangementPatternIds)
    || !value.arrangementPatternIds.every(isStringArray)
    || (typeof value.tempoChanges !== 'undefined'
      && (!Array.isArray(value.tempoChanges)
        || !value.tempoChanges.every(item => item === null
          || (typeof item === 'number' && Number.isFinite(item) && item > 0))))
    || !hasCurrentContentHash(value)
    || typeof value.kitContentHash !== 'string'
    || typeof value.patternPackContentHash !== 'string'
  ) {
    throw new Error('Song bundle manifest is invalid');
  }
};

const assertSongManifestShape: (
  value: unknown,
) => asserts value is SongBundleManifest = (value) => {
  if (
    !isRecord(value)
    || value.format !== SONG_BUNDLE_FORMAT
    || value.version !== SONG_BUNDLE_VERSION
  ) {
    throw new Error('Unsupported song bundle format or version');
  }
  assertSavedSongShape(value.song);
  assertDrumkitSnapshotShape(value.drumkit);
  assertPatternPackShape(value.patternPack);
  if (!hasCurrentContentHash(value.patternPack)) {
    throw new Error('Song bundle pattern-pack content hash is missing or unsupported');
  }
};

type SerializedSongBundle = {
  manifest: SongBundleManifest;
  samplePayloads: Record<string, string>;
};

export const serializeSongExportBundle = (bundle: SongExportBundle): string => JSON.stringify({
  manifest: bundle.manifest,
  samplePayloads: serializeBinaryPayloads(bundle.samplePayloads),
} satisfies SerializedSongBundle);

export const parseSongExportBundle = (value: string): SongExportBundle => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Song bundle file is not valid JSON');
  }
  if (!isRecord(parsed)) throw new Error('Song bundle file is invalid');
  assertSongManifestShape(parsed.manifest);
  if (!isRecord(parsed.samplePayloads)) {
    throw new Error('Song bundle sample payloads are invalid');
  }
  return {
    manifest: parsed.manifest,
    samplePayloads: parseBinaryPayloads(
      parsed.samplePayloads,
      'Song bundle sample payloads are invalid',
    ),
  };
};
