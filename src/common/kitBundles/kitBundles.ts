import {
  calculateKitContentHash,
  calculateSampleFingerprint,
  contentHashIndexKey,
  createContentHashIndex,
  hasCurrentContentHash,
} from '../contentHash';
import type {
  ContentHashMetadata,
  Kit,
  KitChannel,
  Sample,
} from '../sequencerModel';

export const KIT_BUNDLE_FORMAT = 'wds-kit-bundle' as const;
export const KIT_BUNDLE_VERSION = 1;

export type ExportedSample = Sample & Required<ContentHashMetadata> & {
  byteLength: number;
  payloadKey: string;
};

export type DrumkitSnapshot = {
  kit: Kit & Required<ContentHashMetadata>;
  channels: KitChannel[];
  samples: ExportedSample[];
};

export type KitBundleManifest = {
  format: typeof KIT_BUNDLE_FORMAT;
  version: typeof KIT_BUNDLE_VERSION;
  drumkit: DrumkitSnapshot;
};

export type KitExportBundle = {
  manifest: KitBundleManifest;
  samplePayloads: Record<string, ArrayBuffer>;
};

export type CreateDrumkitSnapshotInput = {
  kit: Kit;
  channels: KitChannel[];
  samples: Record<string, Sample>;
  getSampleBytes: (sample: Sample) => Promise<ArrayBuffer>;
};

export type CreatedDrumkitSnapshot = {
  drumkit: DrumkitSnapshot;
  samplePayloads: Record<string, ArrayBuffer>;
  kitHash: ContentHashMetadata;
};

const sampleMetadataMatches = (
  sample: Sample,
  fingerprint: ContentHashMetadata & { byteLength: number },
): boolean => (
  (!sample.contentHash || sample.contentHash === fingerprint.contentHash)
    && (!sample.contentHashAlgorithm
      || sample.contentHashAlgorithm === fingerprint.contentHashAlgorithm)
    && (!sample.contentHashVersion
      || sample.contentHashVersion === fingerprint.contentHashVersion)
    && (typeof sample.byteLength === 'undefined' || sample.byteLength === fingerprint.byteLength)
);

const referencedSamples = (
  kit: Kit,
  channels: KitChannel[],
  samples: Record<string, Sample>,
): Sample[] => {
  const channelsById = channels.reduce<Record<string, KitChannel>>((result, channel) => {
    result[channel.id] = channel;
    return result;
  }, {});

  return kit.channelIds.reduce<Sample[]>((result, channelId) => {
    const channel = channelsById[channelId];
    if (!channel) throw new Error(`Cannot export missing kit channel: ${channelId}`);
    const sample = samples[channel.sampleId];
    if (!sample) throw new Error(`Cannot export missing sample: ${channel.sampleId}`);
    if (!result.some(existing => existing.id === sample.id)) result.push(sample);
    return result;
  }, []);
};

export const createDrumkitSnapshot = async ({
  kit,
  channels,
  samples,
  getSampleBytes,
}: CreateDrumkitSnapshotInput): Promise<CreatedDrumkitSnapshot> => {
  const samplePayloads: Record<string, ArrayBuffer> = {};
  const exportedSamples: ExportedSample[] = [];
  const hashedSamples = { ...samples };

  for (const sample of referencedSamples(kit, channels, samples)) {
    const bytes = await getSampleBytes(sample);
    const fingerprint = await calculateSampleFingerprint(bytes);
    if (!sampleMetadataMatches(sample, fingerprint)) {
      throw new Error(`Stored sample fingerprint does not match payload: ${sample.id}`);
    }
    const payloadKey = fingerprint.contentHash;
    samplePayloads[payloadKey] = bytes;
    const exportedSample: ExportedSample = {
      ...sample,
      ...fingerprint,
      payloadKey,
    };
    exportedSamples.push(exportedSample);
    hashedSamples[sample.id] = exportedSample;
  }

  const kitHash = await calculateKitContentHash({ kit, channels, samples: hashedSamples });
  const channelsById = channels.reduce<Record<string, KitChannel>>((result, channel) => {
    result[channel.id] = channel;
    return result;
  }, {});

  return {
    drumkit: {
      kit: { ...kit, ...kitHash },
      channels: kit.channelIds.map((channelId) => {
        const channel = channelsById[channelId];
        if (!channel) throw new Error(`Cannot export missing kit channel: ${channelId}`);
        return { ...channel };
      }),
      samples: exportedSamples,
    },
    samplePayloads,
    kitHash,
  };
};

export const createKitExportBundle = async (
  input: CreateDrumkitSnapshotInput,
): Promise<KitExportBundle> => {
  const { drumkit, samplePayloads } = await createDrumkitSnapshot(input);
  return {
    manifest: {
      format: KIT_BUNDLE_FORMAT,
      version: KIT_BUNDLE_VERSION,
      drumkit,
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

export type VerifiedDrumkitSnapshot = {
  sampleHashes: Record<string, ContentHashMetadata & { byteLength: number }>;
  samplesById: Record<string, Sample>;
  kitHash: ContentHashMetadata;
};

export const verifyDrumkitSnapshot = async (
  drumkit: DrumkitSnapshot,
  samplePayloads: Record<string, ArrayBuffer>,
): Promise<VerifiedDrumkitSnapshot> => {
  const samplesById: Record<string, Sample> = {};
  const sampleHashes: Record<string, ContentHashMetadata & { byteLength: number }> = {};
  for (const sample of drumkit.samples) {
    const payload = samplePayloads[sample.payloadKey];
    if (!(payload instanceof ArrayBuffer)) {
      throw new Error(`Sample payload is missing: ${sample.payloadKey}`);
    }
    const fingerprint = await calculateSampleFingerprint(payload);
    assertMatchingHash(`Sample ${sample.id}`, sample, fingerprint);
    if (sample.byteLength !== fingerprint.byteLength) {
      throw new Error(`Sample ${sample.id} byte length verification failed`);
    }
    samplesById[sample.id] = { ...sample, ...fingerprint };
    sampleHashes[sample.id] = fingerprint;
  }

  const kitHash = await calculateKitContentHash({
    kit: drumkit.kit,
    channels: drumkit.channels,
    samples: samplesById,
  });
  assertMatchingHash('Drumkit', drumkit.kit, kitHash);

  return { sampleHashes, samplesById, kitHash };
};

export const verifyKitExportBundle = async (
  bundle: KitExportBundle,
): Promise<VerifiedDrumkitSnapshot> => {
  if (
    bundle.manifest.format !== KIT_BUNDLE_FORMAT
    || bundle.manifest.version !== KIT_BUNDLE_VERSION
  ) {
    throw new Error('Unsupported kit bundle format or version');
  }
  return verifyDrumkitSnapshot(bundle.manifest.drumkit, bundle.samplePayloads);
};

export type KitImportResolution = VerifiedDrumkitSnapshot & {
  duplicateKit?: Kit;
  resolvedKitId: string;
};

export const resolveKitBundleImport = async (
  bundle: KitExportBundle,
  existingKits: Kit[],
): Promise<KitImportResolution> => {
  const verified = await verifyKitExportBundle(bundle);
  const duplicateKit = createContentHashIndex(existingKits).get(
    contentHashIndexKey(verified.kitHash),
  );
  return {
    ...verified,
    duplicateKit,
    resolvedKitId: duplicateKit?.id || bundle.manifest.drumkit.kit.id,
  };
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const bytesToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const value = (first << 16) | ((second || 0) << 8) | (third || 0);
    result += BASE64_ALPHABET[(value >> 18) & 63];
    result += BASE64_ALPHABET[(value >> 12) & 63];
    result += index + 1 < bytes.length ? BASE64_ALPHABET[(value >> 6) & 63] : '=';
    result += index + 2 < bytes.length ? BASE64_ALPHABET[value & 63] : '=';
  }
  return result;
};

const base64ToBytes = (value: string): ArrayBuffer => {
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error('Kit bundle contains an invalid sample payload');
  }
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((value.length / 4) * 3 - padding);
  let outputIndex = 0;
  for (let index = 0; index < value.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(value[index]);
    const second = BASE64_ALPHABET.indexOf(value[index + 1]);
    const third = value[index + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 2]);
    const fourth = value[index + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(value[index + 3]);
    const combined = (first << 18) | (second << 12) | (third << 6) | fourth;
    if (outputIndex < bytes.length) bytes[outputIndex++] = (combined >> 16) & 255;
    if (outputIndex < bytes.length) bytes[outputIndex++] = (combined >> 8) & 255;
    if (outputIndex < bytes.length) bytes[outputIndex++] = combined & 255;
  }
  return bytes.buffer;
};

type SerializedKitBundle = {
  manifest: KitBundleManifest;
  samplePayloads: Record<string, string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const assertManifestShape: (value: unknown) => asserts value is KitBundleManifest = (value) => {
  if (!isRecord(value) || value.format !== KIT_BUNDLE_FORMAT || value.version !== KIT_BUNDLE_VERSION) {
    throw new Error('Unsupported kit bundle format or version');
  }
  const drumkit = value.drumkit;
  if (!isRecord(drumkit) || !isRecord(drumkit.kit)
    || !Array.isArray(drumkit.channels) || !Array.isArray(drumkit.samples)) {
    throw new Error('Kit bundle manifest is invalid');
  }
};

export const serializeKitExportBundle = (bundle: KitExportBundle): string => JSON.stringify({
  manifest: bundle.manifest,
  samplePayloads: Object.entries(bundle.samplePayloads).reduce<Record<string, string>>(
    (payloads, [key, buffer]) => {
      payloads[key] = bytesToBase64(buffer);
      return payloads;
    },
    {},
  ),
} satisfies SerializedKitBundle);

export const parseKitExportBundle = (value: string): KitExportBundle => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Kit bundle file is not valid JSON');
  }
  if (!isRecord(parsed)) throw new Error('Kit bundle file is invalid');
  assertManifestShape(parsed.manifest);
  if (!isRecord(parsed.samplePayloads)) throw new Error('Kit bundle sample payloads are invalid');

  const samplePayloads = Object.entries(parsed.samplePayloads).reduce<Record<string, ArrayBuffer>>(
    (payloads, [key, encoded]) => {
      if (typeof encoded !== 'string') throw new Error('Kit bundle sample payloads are invalid');
      payloads[key] = base64ToBytes(encoded);
      return payloads;
    },
    {},
  );
  return { manifest: parsed.manifest, samplePayloads };
};
