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

const findMatchingPatternPack = async (
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

const createUniquePatternPackName = (
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
    const duplicate = await findMatchingPatternPack(existingPatternPacks, verifiedHash);
    if (duplicate) {
      dispatch(loadPatternPack(duplicate));
      dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_IMPORTED));
      return true;
    }

    const name = createUniquePatternPackName(
      bundle.manifest.patternPack.name,
      existingPatternPacks,
    );
    const importedPatternPack: PatternPack = {
      ...bundle.manifest.patternPack,
      id: createPatternPackId(name, existingPatternPacks),
      name,
      ...verifiedHash,
    };
    dispatch(savePatternPackAs(importedPatternPack));
    dispatch(loadPatternPack(importedPatternPack));
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_IMPORTED));
    return true;
  } catch (error) {
    console.error('Pattern pack import failed', error);
    dispatch(showFlashMessage(FLASH_MESSAGES.PATTERN_PACK_TRANSFER_ERROR));
    return false;
  }
};
