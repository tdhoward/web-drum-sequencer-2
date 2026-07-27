import { getSampleFingerprint, loadSample } from '../../services/sampleStore';
import { initializeChannelNotes, removeChannelNotes } from '../notes';
import { uuid } from '../../services/uuid';
import factorySamples from '../../samples.config';
import { setSelectedChannel } from '../master';
import { addSampleFromUrl, setSampleFingerprint } from '../samples';
import { PERCUSSION_TYPES } from '../percussion';
import { showFlashMessage, FLASH_MESSAGES } from '../window';
import { DEFAULT_KIT_ID, sampleIdFromUrl } from '../sequencerModel';
import type {
  KitChannel,
  KitChannelInput,
  KitChannelsState,
  SequencerRootState,
} from '../sequencerModel';
import { getVelocityLayerSampleReferences } from '../velocityLayers';
import {
  SAMPLE_LOAD_STATUSES,
  setSampleLoadStatus,
} from '../sampleLoadStatus';
import { channelsSlice } from './channels.reducer';

const NEW_CHANNEL_NAME_PREFIX = 'New channel';

type Dispatch = (action: unknown) => unknown;

type Thunk = (dispatch: Dispatch, getState: () => SequencerRootState) => unknown;

type NamedChannel = {
  name?: string;
};

type SampleChannel = KitChannelInput & {
  sample: string;
};

type LoadableSample = {
  sample: string;
  sampleId?: string;
};

type DeletableChannel = {
  id: string;
  kitChannelId?: string;
};

export const getNextNewChannelName = (channels: NamedChannel[] = []): string => {
  const usedNumbers = channels.reduce<Set<number>>((numbers, channel) => {
    const match = String(channel.name || '').match(/^New channel ([1-9]\d*)$/);
    if (match) {
      numbers.add(Number(match[1]));
    }
    return numbers;
  }, new Set());

  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return `${NEW_CHANNEL_NAME_PREFIX} ${nextNumber}`;
};

export const {
  setChannelGain,
  setChannelName,
  setChannelPercussionType,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelPitchFine,
  setChannelMuted,
  setChannelSolo,
  addChannel,
  removeChannel,
  updateChannelOrder,
  replaceChannels,
  replaceKitChannels,
  setChannelSample,
  setVelocityLayerSample,
  setVelocityLayerAlignment,
  replaceChannelVelocityLayers,
  setChannelReverb,
} = channelsSlice.actions;

export const loadSampleStatefully = (dispatch: Dispatch, channel: LoadableSample): void => {
  const sampleId = channel.sampleId || sampleIdFromUrl(channel.sample);
  dispatch(setSampleLoadStatus({
    sampleId,
    status: SAMPLE_LOAD_STATUSES.LOADING,
  }));
  loadSample(channel.sample).then((success: boolean) => {
    if (success) {
      dispatch(setSampleLoadStatus({
        sampleId,
        status: SAMPLE_LOAD_STATUSES.LOADED,
      }));
      const fingerprint = getSampleFingerprint?.(channel.sample);
      if (fingerprint) {
        dispatch(setSampleFingerprint(channel.sample, fingerprint));
      }
    } else {
      dispatch(setSampleLoadStatus({
        sampleId,
        status: SAMPLE_LOAD_STATUSES.ERROR,
      }));
    }
  });
};

const getSelectedKitId = (state: SequencerRootState): string => (
  state.song?.selectedKitId || DEFAULT_KIT_ID
);

export const loadChannels = (
  channels: KitChannelInput[],
  targetKitId?: string,
): Thunk => (dispatch, getState) => {
  const state = getState();
  const kitId = targetKitId || getSelectedKitId(state);
  const loadedSampleIds = new Set<string>();
  channels.forEach((channel) => {
    getVelocityLayerSampleReferences(channel).forEach((reference) => {
      if (loadedSampleIds.has(reference.sampleId)) {
        return;
      }
      const sample = reference.sample || state.samples?.entities?.[reference.sampleId]?.url;
      if (!sample) {
        return;
      }
      loadedSampleIds.add(reference.sampleId);
      dispatch(addSampleFromUrl(sample, channel.sourceType || 'factory'));
      loadSampleStatefully(dispatch, {
        sample,
        sampleId: reference.sampleId,
      });
    });
  });
  dispatch(replaceKitChannels(channels, kitId));
};

export const newChannel = (): Thunk => (dispatch, getState) => {
  const channelId = uuid();
  const state = getState();
  const kitId = getSelectedKitId(state);
  const kit = state.kits?.entities?.[kitId];
  const kitChannels: KitChannelsState = state.kitChannels || state.channels || { ids: [], entities: {} };
  const existingKitChannels = (kit?.channelIds || kitChannels.ids || [])
    .map(id => kitChannels.entities[id])
    .filter((channel): channel is KitChannel => Boolean(channel));
  const channelToAdd: SampleChannel = {
    id: channelId,
    name: getNextNewChannelName(existingKitChannels),
    kitId,
    laneId: channelId,
    percussionType: PERCUSSION_TYPES.GENERIC_PERCUSSION,
    sample: factorySamples[0].url,
    gain: 1,
    pitchCoarse: 0,
    pitchFine: 0,
    pan: 0,
  };
  dispatch(addSampleFromUrl(channelToAdd.sample, 'factory'));
  dispatch(addChannel(channelToAdd));
  dispatch(initializeChannelNotes());
  dispatch(setSelectedChannel(channelToAdd.id));
  loadSampleStatefully(dispatch, channelToAdd);
};

export const loadAndSetChannelSample = (channelId: string, sampleURL: string) => (
  dispatch: Dispatch,
): void => {
  dispatch(loadSampleAsset(sampleURL));
  dispatch(setChannelSample(channelId, sampleURL));
};

export const loadSampleAsset = (
  sampleURL: string,
  sourceType = 'user',
) => (
  dispatch: Dispatch,
): void => {
  const sampleId = sampleIdFromUrl(sampleURL);
  dispatch(setSampleLoadStatus({
    sampleId,
    status: SAMPLE_LOAD_STATUSES.LOADING,
  }));
  loadSample(sampleURL).then((success: boolean) => {
    if (success) {
      dispatch(setSampleLoadStatus({
        sampleId,
        status: SAMPLE_LOAD_STATUSES.LOADED,
      }));
      const fingerprint = getSampleFingerprint?.(sampleURL);
      if (fingerprint) {
        dispatch(setSampleFingerprint(sampleURL, fingerprint));
      }
    } else {
      dispatch(setSampleLoadStatus({
        sampleId,
        status: SAMPLE_LOAD_STATUSES.ERROR,
      }));
      dispatch(showFlashMessage(FLASH_MESSAGES.SAMPLE_LOAD_ERROR));
    }
  });
  dispatch(addSampleFromUrl(sampleURL, sourceType));
};

const getKitChannelId = (channel: DeletableChannel): string => channel.kitChannelId || channel.id;

export const deleteChannel = (
  channelId: string,
  channels: DeletableChannel[],
  selectedChannelId: string,
  laneId = channelId,
) => (dispatch: Dispatch): void => {
  if (channels.length === 1) {
    dispatch(newChannel());
    dispatch(removeChannelNotes(laneId));
    dispatch(removeChannel(channelId));
    return;
  }

  if (selectedChannelId === channelId || selectedChannelId === laneId) {
    const nextChannel = channels.find(channel => getKitChannelId(channel) !== channelId);
    dispatch(setSelectedChannel(nextChannel?.id));
  }
  dispatch(removeChannelNotes(laneId));
  dispatch(removeChannel(channelId));
};
