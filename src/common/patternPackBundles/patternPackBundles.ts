import {
  calculatePatternPackContentHash,
  hasCurrentContentHash,
} from '../contentHash';
import type {
  ContentHashMetadata,
  PatternPack,
  PatternSettings,
} from '../sequencerModel';

export const PATTERN_PACK_BUNDLE_FORMAT = 'wds-pattern-pack-bundle' as const;
export const PATTERN_PACK_BUNDLE_VERSION = 1;

export type PatternPackBundleManifest = {
  format: typeof PATTERN_PACK_BUNDLE_FORMAT;
  version: typeof PATTERN_PACK_BUNDLE_VERSION;
  patternPack: PatternPack & Required<ContentHashMetadata>;
};

export type PatternPackExportBundle = {
  manifest: PatternPackBundleManifest;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

const isPatternSettings = (value: unknown): value is PatternSettings => {
  if (!isRecord(value) || !isRecord(value.timeSignature)) return false;
  return isFiniteNumber(value.timeSignature.beatsPerBar)
    && isFiniteNumber(value.timeSignature.beatUnit)
    && isFiniteNumber(value.bars)
    && isFiniteNumber(value.stepsPerBeat);
};

const isPatternPackLane = (value: unknown): boolean => (
  isRecord(value)
  && typeof value.id === 'string'
  && (typeof value.laneId === 'undefined' || typeof value.laneId === 'string')
);

const isPatternPackNote = (value: unknown): boolean => (
  isRecord(value)
  && (isFiniteNumber(value.beat) || isFiniteNumber(value.step))
  && (typeof value.pitch === 'undefined' || isFiniteNumber(value.pitch))
  && (typeof value.velocity === 'undefined' || isFiniteNumber(value.velocity))
);

const withoutLocalNoteIds = (patternPack: PatternPack): PatternPack => ({
  ...patternPack,
  notes: Object.entries(patternPack.notes).reduce<PatternPack['notes']>(
    (portableNotes, [laneId, lanePatterns]) => {
      portableNotes[laneId] = lanePatterns.map(patternNotes => patternNotes.map((note) => {
        const portableNote = { ...note };
        delete portableNote.id;
        return portableNote;
      }));
      return portableNotes;
    },
    {},
  ),
});

const isPatternPackNotes = (value: unknown): boolean => (
  isRecord(value)
  && Object.values(value).every(channelPatterns => (
    Array.isArray(channelPatterns)
    && channelPatterns.every(patternNotes => (
      Array.isArray(patternNotes) && patternNotes.every(isPatternPackNote)
    ))
  ))
);

const assertPatternPackShape: (value: unknown) => asserts value is PatternPack = (value) => {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || !isFiniteNumber(value.bpm)
    || !isFiniteNumber(value.swing)
    || !Array.isArray(value.lanes)
    || !value.lanes.every(isPatternPackLane)
    || !isPatternPackNotes(value.notes)
    || (typeof value.patternNames !== 'undefined'
      && (!Array.isArray(value.patternNames)
        || !value.patternNames.every(name => typeof name === 'string')))
    || (typeof value.patternSettings !== 'undefined'
      && (!Array.isArray(value.patternSettings)
        || !value.patternSettings.every(isPatternSettings)))
  ) {
    throw new Error('Pattern pack bundle manifest is invalid');
  }
};

const assertManifestShape: (
  value: unknown,
) => asserts value is PatternPackBundleManifest = (value) => {
  if (
    !isRecord(value)
    || value.format !== PATTERN_PACK_BUNDLE_FORMAT
    || value.version !== PATTERN_PACK_BUNDLE_VERSION
  ) {
    throw new Error('Unsupported pattern pack bundle format or version');
  }
  assertPatternPackShape(value.patternPack);
  if (!hasCurrentContentHash(value.patternPack)) {
    throw new Error('Pattern pack bundle content hash is missing or unsupported');
  }
};

export const createPatternPackExportBundle = async (
  patternPack: PatternPack,
): Promise<PatternPackExportBundle> => {
  const portablePatternPack = withoutLocalNoteIds(patternPack);
  const contentHash = await calculatePatternPackContentHash(portablePatternPack);
  return {
    manifest: {
      format: PATTERN_PACK_BUNDLE_FORMAT,
      version: PATTERN_PACK_BUNDLE_VERSION,
      patternPack: { ...portablePatternPack, ...contentHash },
    },
  };
};

export const verifyPatternPackExportBundle = async (
  bundle: PatternPackExportBundle,
): Promise<ContentHashMetadata> => {
  assertManifestShape(bundle.manifest);
  const calculated = await calculatePatternPackContentHash(bundle.manifest.patternPack);
  if (bundle.manifest.patternPack.contentHash !== calculated.contentHash) {
    throw new Error('Pattern pack content hash verification failed');
  }
  return calculated;
};

export const serializePatternPackExportBundle = (
  bundle: PatternPackExportBundle,
): string => JSON.stringify(bundle);

export const parsePatternPackExportBundle = (value: string): PatternPackExportBundle => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Pattern pack bundle file is not valid JSON');
  }
  if (!isRecord(parsed)) throw new Error('Pattern pack bundle file is invalid');
  assertManifestShape(parsed.manifest);
  return { manifest: parsed.manifest };
};
