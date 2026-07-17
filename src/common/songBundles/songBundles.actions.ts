import {
  downloadSongFile,
  readSongFile,
  songFileName,
} from '../../services/songFiles';
import { getSampleBytes } from '../../services/sampleStore';
import { channelsSelector } from '../channels';
import {
  KIT_BUNDLE_FORMAT,
  KIT_BUNDLE_VERSION,
  applyPreparedKitBundleImport,
  prepareKitBundleImport,
} from '../kitBundles';
import { replaceKit } from '../kits';
import {
  PATTERN_PACK_BUNDLE_FORMAT,
  PATTERN_PACK_BUNDLE_VERSION,
  applyPreparedPatternPackBundleImport,
  preparePatternPackBundleImport,
} from '../patternPackBundles';
import {
  allPatternPacksSelector,
  currentPatternPackStateSelector,
  selectedPatternPackSelector,
} from '../patternPacks';
import type {
  PatternPack,
  SavedSong,
  SequencerRootState,
  SongState,
} from '../sequencerModel';
import { loadSong } from '../song';
import {
  currentSavedSongStateSelector,
  saveSongAs,
  setSelectedSongId,
  userSongsSelector,
} from '../songLibrary';
import { FLASH_MESSAGES, showFlashMessage } from '../window';
import {
  createSongExportBundle,
  parseSongExportBundle,
  resolveSongBundleImport,
  serializeSongExportBundle,
} from './songBundles';

type SongTransferState = SequencerRootState
  & Parameters<typeof allPatternPacksSelector>[0]
  & Parameters<typeof currentPatternPackStateSelector>[0]
  & Parameters<typeof selectedPatternPackSelector>[0]
  & Parameters<typeof currentSavedSongStateSelector>[0]
  & Parameters<typeof userSongsSelector>[0]
  & Parameters<typeof channelsSelector>[0]
  & {
    song: SongState;
    presets?: Parameters<typeof prepareKitBundleImport>[2]['presets'];
    userSamples?: Parameters<typeof prepareKitBundleImport>[2]['userSamples'];
  };

type Dispatch = (action: unknown) => unknown;
type GetState = () => SongTransferState;

const selectedKitParts = (state: SongTransferState) => {
  const kit = state.kits?.entities?.[state.song.selectedKitId];
  if (!kit) throw new Error('The selected kit could not be found');
  const channelState = state.kitChannels || state.channels;
  if (!channelState) throw new Error('The selected kit channels could not be found');
  const channels = kit.channelIds.map((channelId) => {
    const channel = channelState.entities[channelId];
    if (!channel) throw new Error(`The selected kit channel could not be found: ${channelId}`);
    return channel;
  });
  return { kit, channels, samples: state.samples?.entities || {} };
};

const currentPortablePatternPack = (state: SongTransferState): PatternPack => {
  const selected = selectedPatternPackSelector(state);
  if (!selected) throw new Error('The selected pattern pack could not be found');
  return {
    ...currentPatternPackStateSelector(state),
    id: selected.id,
    name: selected.name,
  };
};

export const exportCurrentSong = () => async (
  dispatch: Dispatch,
  getState: GetState,
): Promise<boolean> => {
  try {
    const state = getState();
    const song = currentSavedSongStateSelector(state);
    const { kit, channels, samples } = selectedKitParts(state);
    const patternPack = currentPortablePatternPack(state);
    const includedLaneIds = channelsSelector(state).map(channel => channel.id);
    const bundle = await createSongExportBundle({
      song,
      kit,
      channels,
      samples,
      patternPack,
      includedLaneIds,
      getSampleBytes: sample => getSampleBytes(
        sample.url || sample.id.replace(/^sample:/, ''),
      ),
    });
    dispatch(replaceKit(bundle.manifest.drumkit.kit));
    await downloadSongFile(
      serializeSongExportBundle(bundle),
      songFileName(song.name),
    );
    dispatch(showFlashMessage(FLASH_MESSAGES.SONG_EXPORTED));
    return true;
  } catch (error) {
    console.error('Song export failed', error);
    dispatch(showFlashMessage(FLASH_MESSAGES.SONG_TRANSFER_ERROR));
    return false;
  }
};

const uniqueImportedSongName = (requestedName: string, songs: SavedSong[]): string => {
  const baseName = requestedName.trim() || 'Imported Song';
  const usedNames = new Set(songs.map(song => song.name.toLowerCase()));
  if (!usedNames.has(baseName.toLowerCase())) return baseName;
  let suffix = 1;
  let candidate = `${baseName} (Imported)`;
  while (usedNames.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${baseName} (Imported ${suffix})`;
  }
  return candidate;
};

const slugify = (value: string): string => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const uniqueImportedSongId = (name: string, songs: SavedSong[]): string => {
  const baseId = `user-${slugify(name) || 'imported-song'}`;
  const usedIds = new Set(songs.map(song => song.id));
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return id;
};

export const importSongFile = (file: File) => async (
  dispatch: Dispatch,
  getState: GetState,
): Promise<boolean> => {
  try {
    const serialized = await readSongFile(file);
    const bundle = parseSongExportBundle(serialized);
    const state = getState();
    const allPatternPacks = allPatternPacksSelector(state);
    const userSongs = userSongsSelector(state);
    const resolution = await resolveSongBundleImport(bundle, {
      kits: Object.values(state.kits?.entities || {}),
      patternPacks: allPatternPacks,
      songs: userSongs,
    });
    const patternBundle = {
      manifest: {
        format: PATTERN_PACK_BUNDLE_FORMAT,
        version: PATTERN_PACK_BUNDLE_VERSION,
        patternPack: bundle.manifest.patternPack,
      },
    } as const;
    const preparedPatternPack = await preparePatternPackBundleImport(
      patternBundle,
      resolution.patternPackHash,
      allPatternPacks,
    );
    const duplicateSong = resolution.duplicateSong;
    const songName = duplicateSong?.name || uniqueImportedSongName(
      bundle.manifest.song.name,
      userSongs,
    );
    const songId = duplicateSong?.id || uniqueImportedSongId(songName, userSongs);
    const kitBundle = {
      manifest: {
        format: KIT_BUNDLE_FORMAT,
        version: KIT_BUNDLE_VERSION,
        drumkit: bundle.manifest.drumkit,
      },
      samplePayloads: bundle.samplePayloads,
    } as const;
    const preparedKit = await prepareKitBundleImport(kitBundle, resolution, state);
    const importedSong: SavedSong = {
      ...bundle.manifest.song,
      id: songId,
      name: songName,
      selectedKitId: preparedKit.kitId,
      patternPackId: preparedPatternPack.patternPack.id,
      kitContentHash: resolution.kitHash.contentHash,
      patternPackContentHash: resolution.patternPackHash.contentHash,
      contentHash: resolution.songHash.contentHash,
      contentHashAlgorithm: resolution.songHash.contentHashAlgorithm,
      contentHashVersion: resolution.songHash.contentHashVersion,
    };

    applyPreparedKitBundleImport(dispatch, preparedKit);
    applyPreparedPatternPackBundleImport(dispatch, preparedPatternPack);
    dispatch(saveSongAs(importedSong));
    dispatch(loadSong({
      ...importedSong,
      fallbackBpm: preparedPatternPack.patternPack.bpm,
    }));
    dispatch(setSelectedSongId(importedSong.id));
    dispatch(showFlashMessage(FLASH_MESSAGES.SONG_IMPORTED));
    return true;
  } catch (error) {
    console.error('Song import failed', error);
    dispatch(showFlashMessage(FLASH_MESSAGES.SONG_TRANSFER_ERROR));
    return false;
  }
};
