import presets from '../../presets';
import {
  downloadKitFile,
  kitFileName,
  readKitFile,
} from '../../services/kitFiles';
import {
  getSampleBytes,
  saveImportedSampleBytes,
} from '../../services/sampleStore';
import { uuid } from '../../services/uuid';
import { kitIdFromPresetName, replaceKit } from '../kits';
import { loadPreset, savePresetAs } from '../presets';
import type { PresetsState, UserPreset } from '../presets';
import type {
  ContentHashMetadata,
  Kit,
  KitChannel,
  KitChannelInput,
  Sample,
  SequencerRootState,
  SongState,
} from '../sequencerModel';
import {
  addUserSample,
  getUserSampleId,
  normalizeUserSample,
} from '../userSamples';
import type { UserSamplesState } from '../userSamples';
import { FLASH_MESSAGES, showFlashMessage } from '../window';
import {
  createKitExportBundle,
  parseKitExportBundle,
  serializeKitExportBundle,
  verifyKitExportBundle,
} from './kitBundles';
import type { ExportedSample } from './kitBundles';

export type KitTransferState = SequencerRootState & {
  song: SongState;
  presets?: PresetsState;
  userSamples?: UserSamplesState;
};

type Dispatch = (action: unknown) => unknown;
type GetState = () => KitTransferState;

const hasHash = (
  value: Partial<ContentHashMetadata>,
  hash: ContentHashMetadata,
): boolean => (
  value.contentHashAlgorithm === hash.contentHashAlgorithm
  && value.contentHashVersion === hash.contentHashVersion
  && value.contentHash === hash.contentHash
);

const selectedKitParts = (state: KitTransferState) => {
  const kit = state.kits?.entities?.[state.song.selectedKitId];
  if (!kit) throw new Error('The selected kit could not be found');
  const channelState = state.kitChannels || state.channels;
  if (!channelState) throw new Error('The selected kit channels could not be found');
  const channels = kit.channelIds.map((channelId) => {
    const channel = channelState.entities[channelId];
    if (!channel) throw new Error(`The selected kit channel could not be found: ${channelId}`);
    return channel;
  });
  const samples = state.samples?.entities || {};
  return { kit, channels, samples };
};

export const exportSelectedKit = () => async (
  dispatch: Dispatch,
  getState: GetState,
): Promise<boolean> => {
  try {
    const { kit, channels, samples } = selectedKitParts(getState());
    const bundle = await createKitExportBundle({
      kit,
      channels,
      samples,
      getSampleBytes: (sample) => {
        const url = sample.url || sample.id.replace(/^sample:/, '');
        return getSampleBytes(url);
      },
    });
    dispatch(replaceKit(bundle.manifest.drumkit.kit));
    await downloadKitFile(
      serializeKitExportBundle(bundle),
      kitFileName(kit.name),
    );
    dispatch(showFlashMessage(FLASH_MESSAGES.KIT_EXPORTED));
    return true;
  } catch (error) {
    console.error('Kit export failed', error);
    dispatch(showFlashMessage(FLASH_MESSAGES.KIT_TRANSFER_ERROR));
    return false;
  }
};

const existingPresetWithHash = (
  userPresets: UserPreset[],
  hash: ContentHashMetadata,
): UserPreset | undefined => userPresets.find(preset => hasHash(preset, hash));

const sampleUrl = (sample: Sample): string => sample.url || sample.id.replace(/^sample:/, '');

const createExistingSampleHashIndex = (state: KitTransferState): Map<string, string> => {
  const index = new Map<string, string>();
  Object.values(state.samples?.entities || {}).forEach((sample) => {
    if (sample?.contentHash) index.set(sample.contentHash, sampleUrl(sample));
  });
  (state.userSamples || []).forEach((userSample) => {
    const normalized = normalizeUserSample(userSample);
    if (normalized.contentHash) index.set(normalized.contentHash, normalized.id);
  });
  return index;
};

const safeSampleStem = (value: string): string => {
  const stem = value
    .replace(/[?#].*$/, '')
    .replace(/\.[a-z0-9]{1,8}$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return stem || 'sample';
};

const createImportedSampleId = (
  sample: ExportedSample,
  existingIds: Set<string>,
): string => {
  const sourceName = sample.fileName || sample.name || sample.url || 'sample';
  const extensionMatch = sourceName.replace(/[?#].*$/, '').match(/(\.[a-z0-9]{1,8})$/i);
  const extension = extensionMatch?.[1]?.toLowerCase() || '.audio';
  const baseId = `${safeSampleStem(sourceName)}-import-${sample.contentHash.slice(0, 8)}`;
  let candidate = `${baseId}${extension}`;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${baseId}-${suffix}${extension}`;
    suffix += 1;
  }
  existingIds.add(candidate);
  return candidate;
};

const createUniqueKitName = (requestedName: string, userPresets: UserPreset[]): string => {
  const baseName = requestedName.trim() || 'Imported Kit';
  const usedNames = new Set([
    ...presets.map(preset => preset.name.toLowerCase()),
    ...userPresets.map(preset => preset.name.toLowerCase()),
  ]);
  if (!usedNames.has(baseName.toLowerCase())) return baseName;
  let suffix = 1;
  let candidate = `${baseName} (Imported)`;
  while (usedNames.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${baseName} (Imported ${suffix})`;
  }
  return candidate;
};

const createUniqueKitId = (state: KitTransferState): string => {
  const usedIds = new Set(state.kits?.ids || []);
  let id = `kit-import-${uuid()}`;
  while (usedIds.has(id)) id = `kit-import-${uuid()}`;
  return id;
};

const createImportedChannel = (
  channel: KitChannel,
  kitId: string,
  importedSample: ExportedSample,
  localSampleUrl: string,
): KitChannelInput => {
  const settings = { ...channel } as Record<string, unknown>;
  ['id', 'kitId', 'laneId', 'sampleId', 'sampleLoaded'].forEach((field) => {
    delete settings[field];
  });
  const id = `kit-channel-${uuid()}`;
  return {
    ...settings,
    id,
    kitId,
    laneId: id,
    sample: localSampleUrl,
    sourceType: 'imported',
    fileName: importedSample.fileName,
    alignmentOffset: importedSample.alignmentOffset || 0,
  };
};

const resolveActiveKitDuplicate = (
  state: KitTransferState,
  hash: ContentHashMetadata,
): Kit | undefined => {
  const activeKit = state.kits?.entities?.[state.song.selectedKitId];
  return activeKit && hasHash(activeKit, hash) ? activeKit : undefined;
};

type ImportedUserSample = {
  id: string;
  name: string;
  sourceName?: string;
  sourceType: 'imported';
} & ContentHashMetadata & { byteLength: number };

export type PreparedKitBundleImport = {
  kitId: string;
  duplicatePreset?: UserPreset;
  activeDuplicate?: Kit;
  importedPreset?: UserPreset;
  importedKit?: Kit;
  newUserSamples: ImportedUserSample[];
};

export const prepareKitBundleImport = async (
  bundle: ReturnType<typeof parseKitExportBundle>,
  verified: {
    sampleHashes: Record<string, ContentHashMetadata & { byteLength: number }>;
    kitHash: ContentHashMetadata;
  },
  state: KitTransferState,
): Promise<PreparedKitBundleImport> => {
  const userPresets = state.presets?.userPresets || [];
  const duplicatePreset = existingPresetWithHash(userPresets, verified.kitHash);
  if (duplicatePreset?.channels) {
    return {
      kitId: duplicatePreset.kitId || kitIdFromPresetName(duplicatePreset.name),
      duplicatePreset,
      newUserSamples: [],
    };
  }
  const activeDuplicate = resolveActiveKitDuplicate(state, verified.kitHash);
  if (activeDuplicate) {
    return {
      kitId: activeDuplicate.id,
      activeDuplicate,
      newUserSamples: [],
    };
  }

  const { drumkit } = bundle.manifest;
  const sampleHashIndex = createExistingSampleHashIndex(state);
  const existingSampleIds = new Set((state.userSamples || []).map(getUserSampleId));
  const localSampleUrls = new Map<string, string>();
  const newUserSamples: ImportedUserSample[] = [];

  for (const sample of drumkit.samples) {
    const existingUrl = sampleHashIndex.get(sample.contentHash)
      || localSampleUrls.get(sample.contentHash);
    if (existingUrl) {
      localSampleUrls.set(sample.contentHash, existingUrl);
      continue;
    }
    const localId = createImportedSampleId(sample, existingSampleIds);
    const fingerprint = verified.sampleHashes[sample.id];
    await saveImportedSampleBytes(
      localId,
      bundle.samplePayloads[sample.payloadKey],
      fingerprint,
    );
    localSampleUrls.set(sample.contentHash, localId);
    sampleHashIndex.set(sample.contentHash, localId);
    newUserSamples.push({
      id: localId,
      name: sample.name?.trim() || sample.fileName?.trim() || localId,
      sourceName: sample.fileName || sample.url,
      sourceType: 'imported',
      ...fingerprint,
    });
  }

  const kitId = createUniqueKitId(state);
  const name = createUniqueKitName(drumkit.kit.name, userPresets);
  const samplesById = drumkit.samples.reduce<Record<string, ExportedSample>>((result, sample) => {
    result[sample.id] = sample;
    return result;
  }, {});
  const channels = drumkit.channels.map((channel) => {
    const importedSample = samplesById[channel.sampleId];
    if (!importedSample) throw new Error(`Imported kit sample is missing: ${channel.sampleId}`);
    const localUrl = localSampleUrls.get(importedSample.contentHash);
    if (!localUrl) throw new Error(`Imported kit sample could not be resolved: ${channel.sampleId}`);
    return createImportedChannel(channel, kitId, importedSample, localUrl);
  });
  const importedPreset: UserPreset = {
    name,
    kitId,
    channels,
    ...verified.kitHash,
  };
  return {
    kitId,
    importedPreset,
    importedKit: {
      id: kitId,
      name,
      channelIds: channels.map(channel => channel.id),
      ...verified.kitHash,
    },
    newUserSamples,
  };
};

export const applyPreparedKitBundleImport = (
  dispatch: Dispatch,
  prepared: PreparedKitBundleImport,
): void => {
  if (prepared.duplicatePreset) {
    dispatch(loadPreset(prepared.duplicatePreset as Parameters<typeof loadPreset>[0]));
    return;
  }
  if (prepared.activeDuplicate) return;
  if (!prepared.importedPreset || !prepared.importedKit) {
    throw new Error('Imported kit could not be prepared');
  }
  prepared.newUserSamples.forEach(sample => dispatch(addUserSample(sample)));
  dispatch(savePresetAs(prepared.importedPreset));
  dispatch(loadPreset(prepared.importedPreset as Parameters<typeof loadPreset>[0]));
  dispatch(replaceKit(prepared.importedKit));
};

export const importKitFile = (file: File) => async (
  dispatch: Dispatch,
  getState: GetState,
): Promise<boolean> => {
  try {
    const serialized = await readKitFile(file);
    const bundle = parseKitExportBundle(serialized);
    const verified = await verifyKitExportBundle(bundle);
    const prepared = await prepareKitBundleImport(bundle, verified, getState());
    applyPreparedKitBundleImport(dispatch, prepared);
    dispatch(showFlashMessage(FLASH_MESSAGES.KIT_IMPORTED));
    return true;
  } catch (error) {
    console.error('Kit import failed', error);
    dispatch(showFlashMessage(FLASH_MESSAGES.KIT_TRANSFER_ERROR));
    return false;
  }
};
