import { PERCUSSION_TYPES } from '../percussion';
import {
  DEFAULT_NOTE_VELOCITY,
  beatToStep,
  normalizeArrangementPatternIds,
  normalizeNoteVelocity,
  normalizePatternSettings,
  normalizeTempoChanges,
} from '../sequencerModel';
import type {
  ContentHashMetadata,
  Kit,
  KitChannel,
  PatternPack,
  PatternPackLane,
  Sample,
  SavedSong,
} from '../sequencerModel';
import {
  getPatternPackPatternCount,
  getPatternPackPatternSettings,
} from '../patternPacks/patternPacks.utils';

export const CONTENT_HASH_ALGORITHM = 'sha256' as const;
export const CONTENT_HASH_VERSION = 1;

export type EntityContentHashType = 'sample' | 'kit' | 'pattern-pack' | 'song';

type CanonicalPrimitive = null | boolean | number | string;
type CanonicalValue = CanonicalPrimitive | CanonicalValue[] | { [key: string]: CanonicalValue };

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const canonicalize = (value: unknown, path: string): CanonicalValue => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Cannot hash non-finite number at ${path}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => {
      if (typeof item === 'undefined') {
        throw new TypeError(`Cannot hash undefined array item at ${path}[${index}]`);
      }
      return canonicalize(item, `${path}[${index}]`);
    });
  }

  if (isPlainObject(value)) {
    return Object.keys(value).sort().reduce<Record<string, CanonicalValue>>((result, key) => {
      if (typeof value[key] !== 'undefined') {
        result[key] = canonicalize(value[key], `${path}.${key}`);
      }
      return result;
    }, {});
  }

  throw new TypeError(`Cannot hash unsupported value at ${path}`);
};

export const canonicalStringify = (value: unknown): string => (
  JSON.stringify(canonicalize(value, '$'))
);

const bytesToHex = (bytes: Uint8Array): string => Array.from(
  bytes,
  byte => byte.toString(16).padStart(2, '0'),
).join('');

const toOwnedBytes = (value: ArrayBuffer | ArrayBufferView): Uint8Array<ArrayBuffer> => {
  const source = value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  const owned = new Uint8Array(new ArrayBuffer(source.byteLength));
  owned.set(source);
  return owned;
};

const digestSha256 = async (bytes: Uint8Array<ArrayBuffer>): Promise<string> => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto SHA-256 is unavailable');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
};

const markerFor = (type: EntityContentHashType): string => (
  `wds:${type}:musical-content:v${CONTENT_HASH_VERSION}`
);

const combineMarkerAndBytes = (
  type: EntityContentHashType,
  content: Uint8Array,
): Uint8Array<ArrayBuffer> => {
  const marker = new TextEncoder().encode(`${markerFor(type)}\n`);
  const input = new Uint8Array(new ArrayBuffer(marker.byteLength + content.byteLength));
  input.set(marker, 0);
  input.set(content, marker.byteLength);
  return input;
};

const metadata = (contentHash: string): ContentHashMetadata => ({
  contentHashAlgorithm: CONTENT_HASH_ALGORITHM,
  contentHashVersion: CONTENT_HASH_VERSION,
  contentHash,
});

export const hashCanonicalContent = async (
  type: Exclude<EntityContentHashType, 'sample'>,
  value: unknown,
): Promise<ContentHashMetadata> => {
  const content = new TextEncoder().encode(canonicalStringify(value));
  return metadata(await digestSha256(combineMarkerAndBytes(type, content)));
};

export type SampleFingerprint = ContentHashMetadata & {
  byteLength: number;
};

export const calculateSampleFingerprint = async (
  value: ArrayBuffer | ArrayBufferView,
): Promise<SampleFingerprint> => {
  const bytes = toOwnedBytes(value);
  return {
    ...metadata(await digestSha256(combineMarkerAndBytes('sample', bytes))),
    byteLength: bytes.byteLength,
  };
};

const normalizedTags = (value: unknown): string[] => (
  Array.isArray(value)
    ? [...new Set(value.filter((tag): tag is string => typeof tag === 'string'))].sort()
    : []
);

const finiteNumber = (value: unknown, fallback: number): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const canonicalLane = (lane: PatternPackLane) => ({
  percussionType: lane.percussionType || PERCUSSION_TYPES.GENERIC_PERCUSSION,
  articulation: typeof lane.articulation === 'string' ? lane.articulation : '',
  register: typeof lane.register === 'string' ? lane.register : '',
  tags: normalizedTags(lane.tags),
});

const compareNoteContent = (
  left: { step: number; pitch: number; velocity: number },
  right: { step: number; pitch: number; velocity: number },
): number => (
  left.step - right.step || left.pitch - right.pitch || left.velocity - right.velocity
);

export const createPatternPackCanonicalContent = (patternPack: PatternPack) => {
  const patternCount = getPatternPackPatternCount(patternPack);
  const patternSettings = getPatternPackPatternSettings(patternPack);
  const laneIds = patternPack.lanes.map(lane => lane.laneId || lane.id);

  return {
    bpm: finiteNumber(patternPack.bpm, 120),
    swing: finiteNumber(patternPack.swing, 0),
    patterns: Array.from({ length: patternCount }, (_, patternIndex) => {
      const settings = normalizePatternSettings(patternSettings[patternIndex]);
      return {
        settings,
        lanes: laneIds.map((laneId) => {
          const notes = patternPack.notes[laneId]?.[patternIndex] || [];
          return notes.map(note => ({
            step: typeof note.step === 'number'
              ? note.step
              : beatToStep(note.beat, settings),
            pitch: finiteNumber(note.pitch, 0),
            velocity: normalizeNoteVelocity(note.velocity ?? DEFAULT_NOTE_VELOCITY),
          })).sort(compareNoteContent);
        }),
      };
    }),
    lanes: patternPack.lanes.map(canonicalLane),
  };
};

export const calculatePatternPackContentHash = (patternPack: PatternPack) => (
  hashCanonicalContent('pattern-pack', createPatternPackCanonicalContent(patternPack))
);

export type KitContentInput = {
  kit: Kit;
  channels: KitChannel[];
  samples: Record<string, Sample>;
};

const requireSampleHash = (sample: Sample | undefined, channel: KitChannel): string => {
  if (!sample?.contentHash) {
    throw new Error(`Sample content hash is missing for kit channel ${channel.id}`);
  }
  return sample.contentHash;
};

export const createKitCanonicalContent = ({ kit, channels, samples }: KitContentInput) => {
  const channelsById = channels.reduce<Record<string, KitChannel>>((result, channel) => {
    result[channel.id] = channel;
    return result;
  }, {});
  const orderedChannels = kit.channelIds.map(channelId => channelsById[channelId]).filter(
    (channel): channel is KitChannel => Boolean(channel),
  );

  if (orderedChannels.length !== kit.channelIds.length) {
    throw new Error(`Kit ${kit.id} references a missing channel`);
  }

  return {
    channels: orderedChannels.map((channel) => {
      const sample = samples[channel.sampleId];
      return {
        percussionType: channel.percussionType || PERCUSSION_TYPES.GENERIC_PERCUSSION,
        articulation: typeof channel.articulation === 'string' ? channel.articulation : '',
        register: typeof channel.register === 'string' ? channel.register : '',
        tags: normalizedTags(channel.tags),
        gain: finiteNumber(channel.gain, 1),
        pan: finiteNumber(channel.pan, 0),
        muted: Boolean(channel.muted),
        solo: Boolean(channel.solo),
        reverb: finiteNumber(channel.reverb, 0),
        pitchCoarse: finiteNumber(channel.pitchCoarse, 0),
        pitchFine: finiteNumber(channel.pitchFine, 0),
        sample: {
          contentHash: requireSampleHash(sample, channel),
          alignmentOffset: finiteNumber(sample?.alignmentOffset, 0),
        },
      };
    }),
  };
};

export const calculateKitContentHash = (input: KitContentInput) => (
  hashCanonicalContent('kit', createKitCanonicalContent(input))
);

export type SongContentHashInput = {
  song: SavedSong;
  kitContentHash: string;
  patternPack: PatternPack;
  patternPackContentHash: string;
};

const arrangementPatternIndex = (patternId: string): number => {
  const match = /^pattern-(\d+)$/.exec(patternId);
  if (!match) {
    throw new Error(`Cannot canonicalize song pattern ID: ${patternId}`);
  }
  return Number(match[1]);
};

export const createSongCanonicalContent = ({
  song,
  kitContentHash,
  patternPack,
  patternPackContentHash,
}: SongContentHashInput) => {
  const patternCount = getPatternPackPatternCount(patternPack);
  const arrangement = normalizeArrangementPatternIds(song.arrangementPatternIds).map(column => (
    column.map(arrangementPatternIndex)
      .filter(patternIndex => patternIndex >= 0 && patternIndex < patternCount)
      .sort((left, right) => left - right)
  ));

  return {
    kitContentHash,
    patternPackContentHash,
    arrangement,
    tempoChanges: normalizeTempoChanges(song.tempoChanges, arrangement.length, patternPack.bpm),
  };
};

export const calculateSongContentHash = (input: SongContentHashInput) => (
  hashCanonicalContent('song', createSongCanonicalContent(input))
);

export const hasCurrentContentHash = (value: Partial<ContentHashMetadata>): boolean => (
  value.contentHashAlgorithm === CONTENT_HASH_ALGORITHM
    && value.contentHashVersion === CONTENT_HASH_VERSION
    && typeof value.contentHash === 'string'
    && /^[0-9a-f]{64}$/.test(value.contentHash)
);

export const findByContentHash = <TEntity extends Partial<ContentHashMetadata>>(
  entities: TEntity[],
  hash: ContentHashMetadata,
): TEntity | undefined => entities.find(entity => (
  entity.contentHashAlgorithm === hash.contentHashAlgorithm
    && entity.contentHashVersion === hash.contentHashVersion
    && entity.contentHash === hash.contentHash
));

export const contentHashIndexKey = (hash: ContentHashMetadata): string => (
  `${hash.contentHashAlgorithm}:v${hash.contentHashVersion}:${hash.contentHash}`
);

export const createContentHashIndex = <TEntity extends Partial<ContentHashMetadata>>(
  entities: TEntity[],
): Map<string, TEntity> => entities.reduce<Map<string, TEntity>>((index, entity) => {
  if (hasCurrentContentHash(entity)) {
    index.set(contentHashIndexKey(entity as ContentHashMetadata), entity);
  }
  return index;
}, new Map());
