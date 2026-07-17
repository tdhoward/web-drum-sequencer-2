import {
  downloadPatternPackFile,
  patternPackFileName,
  readPatternPackFile,
} from '../../services/patternPackFiles';
import {
  calculatePatternPackContentHash,
  hasCurrentContentHash,
} from '../contentHash';
import type {
  ContentHashMetadata,
  PatternPack,
  SequencerRootState,
} from '../sequencerModel';
import {
  allPatternPacksSelector,
  createPatternPackId,
  currentPatternPackStateSelector,
  loadPatternPack,
  savePatternPackAs,
  selectedPatternPackSelector,
} from '../patternPacks';
import { channelsSelector } from '../channels';
import { FLASH_MESSAGES, showFlashMessage } from '../window';
import {
  createPatternPackExportBundle,
  parsePatternPackExportBundle,
  serializePatternPackExportBundle,
  verifyPatternPackExportBundle,
} from './patternPackBundles';

type PatternPackTransferState = SequencerRootState
  & Parameters<typeof allPatternPacksSelector>[0]
  & Parameters<typeof currentPatternPackStateSelector>[0]
  & Parameters<typeof selectedPatternPackSelector>[0]
  & Parameters<typeof channelsSelector>[0];

type Dispatch = (action: unknown) => unknown;
type GetState = () => PatternPackTransferState;

const sameHash = (
  value: Partial<ContentHashMetadata>,
  hash: ContentHashMetadata,
): boolean => (
  hasCurrentContentHash(value) && value.contentHash === hash.contentHash
);

export const findMatchingPatternPack = async (
  existingPatternPacks: PatternPack[],
  hash: ContentHashMetadata,
): Promise<PatternPack | undefined> => {
  for (const patternPack of existingPatternPacks) {
    if (sameHash(patternPack, hash)) return patternPack;
    const existingHash = await calculatePatternPackContentHash(patternPack);
    if (existingHash.contentHash === hash.contentHash) return patternPack;
  }
  return undefined;
};

export const createUniquePatternPackName = (
  requestedName: string,
  existingPatternPacks: PatternPack[],
): string => {
  const baseName = requestedName.trim() || 'Imported Pattern Pack';
  const usedNames = new Set(existingPatternPacks.map(pack => pack.name.toLowerCase()));
  if (!usedNames.has(baseName.toLowerCase())) return baseName;
  let suffix = 1;
  let candidate = `${baseName} (Imported)`;
  while (usedNames.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${baseName} (Imported ${suffix})`;
  }
  return candidate;
};

export type PreparedPatternPackBundleImport = {
  patternPack: PatternPack;
  isNew: boolean;
};

export const preparePatternPackBundleImport = async (
  bundle: ReturnType<typeof parsePatternPackExportBundle>,
  verifiedHash: ContentHashMetadata,
  existingPatternPacks: PatternPack[],
): Promise<PreparedPatternPackBundleImport> => {
  const duplicate = await findMatchingPatternPack(existingPatternPacks, verifiedHash);
  if (duplicate) return { patternPack: duplicate, isNew: false };

  const name = createUniquePatternPackName(
    bundle.manifest.patternPack.name,
    existingPatternPacks,
  );
  return {
    patternPack: {
      ...bundle.manifest.patternPack,
      id: createPatternPackId(name, existingPatternPacks),
      name,
      ...verifiedHash,
    },
    isNew: true,
  };
};

export const applyPreparedPatternPackBundleImport = (
  dispatch: Dispatch,
  prepared: PreparedPatternPackBundleImport,
): void => {
  if (prepared.isNew) dispatch(savePatternPackAs(prepared.patternPack));
  dispatch(loadPatternPack(prepared.patternPack));
};

export const exportSelectedPatternPack = () => async (
  dispatch: Dispatch,
  getState: GetState,
): Promise<boolean> => {
  try {
    const state = getState();
    const selectedPatternPack = selectedPatternPackSelector(state);
    if (!selectedPatternPack) throw new Error('The selected pattern pack could not be found');
    const patternPack: PatternPack = {
      ...currentPatternPackStateSelector(state),
      id: selectedPatternPack.id,
      name: selectedPatternPack.name,
    };
    const includedLaneIds = channelsSelector(state).map(channel => channel.id);
    const bundle = await createPatternPackExportBundle(patternPack, includedLaneIds);
    await downloadPatternPackFile(
      serializePatternPackExportBundle(bundle),
      patternPackFileName(patternPack.name),
    );
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_EXPORTED));
    return true;
  } catch (error) {
    console.error('Pattern pack export failed', error);
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_TRANSFER_ERROR));
    return false;
  }
};

export const importPatternPackFile = (file: File) => async (
  dispatch: Dispatch,
  getState: GetState,
): Promise<boolean> => {
  try {
    const serialized = await readPatternPackFile(file);
    const bundle = parsePatternPackExportBundle(serialized);
    const verifiedHash = await verifyPatternPackExportBundle(bundle);
    const state = getState();
    const existingPatternPacks = allPatternPacksSelector(state);
    const prepared = await preparePatternPackBundleImport(
      bundle,
      verifiedHash,
      existingPatternPacks,
    );
    applyPreparedPatternPackBundleImport(dispatch, prepared);
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_IMPORTED));
    return true;
  } catch (error) {
    console.error('Pattern pack import failed', error);
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_TRANSFER_ERROR));
    return false;
  }
};
