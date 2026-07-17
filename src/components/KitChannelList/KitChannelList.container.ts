import { connect } from 'react-redux';
import {
  channelsSelector,
  deleteChannel,
  selectedChannelSelector,
  saveEditedUserSample,
  setChannelGain,
  setChannelName,
  setChannelPercussionType,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelReverb,
  setSampleAlignmentOffset,
  updateChannelOrder,
  userSamplesSelector,
} from '../../common';
import { playNoteNow } from '../../services/audioScheduler';
import { KitChannelListComponent } from './KitChannelList.component';
import type { LegacyChannel } from '../../common';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

type EventValueTarget = EventTarget & {
  value?: string | number;
};

type KitChannelListDispatchProps = {
  deleteChannel: (
    channelId: string,
    channels: LegacyChannel[],
    selectedChannelId: string,
    laneId?: string,
  ) => void;
  setChannelGain: (channelId: string, gain: number) => void;
  setChannelName: (channelId: string, name: string) => void;
  setChannelPercussionType: (channelId: string, percussionType: string) => void;
  setChannelPan: (channelId: string, pan: number) => void;
  setChannelPitchCoarse: (channelId: string, pitchCoarse: number) => void;
  setChannelReverb: (channelId: string, reverb: number) => void;
  setSampleAlignmentOffset: (sampleId: string, alignmentOffset: number) => void;
  saveEditedUserSample: (
    channelId: string,
    audioBuffer: AudioBuffer,
    sourceName?: string,
    sampleName?: string,
    replaceSampleId?: string,
  ) => Promise<void>;
  updateChannelOrder: (oldIndex: number, newIndex: number) => void;
};

const getKitChannelId = (channel: LegacyChannel): string => channel.kitChannelId || channel.id;

const getEventNumber = (event: Event): number => Number(
  (event.target as EventValueTarget | null)?.value ?? 0,
);

const confirmChannelDelete = (channel: LegacyChannel): boolean => {
  const channelName = channel.name || channel.id;
  return window.confirm(`Delete channel "${channelName}"? This will also remove its notes from the current song.`);
};

const mapStateToProps = (state: RootState) => ({
  channels: channelsSelector(state),
  selectedChannelId: selectedChannelSelector(state) || '',
  userSamples: userSamplesSelector(state) || [],
});

type KitChannelListStateProps = ReturnType<typeof mapStateToProps>;

const mapDispatchToProps = (dispatch: AppDispatch): KitChannelListDispatchProps => ({
  deleteChannel: (channelId, channels, selectedChannelId, laneId) => {
    dispatch(deleteChannel(channelId, channels, selectedChannelId, laneId) as unknown as AppAction);
  },
  setChannelGain: (channelId, gain) => {
    dispatch(setChannelGain(channelId, gain));
  },
  setChannelName: (channelId, name) => {
    dispatch(setChannelName(channelId, name));
  },
  setChannelPercussionType: (channelId, percussionType) => {
    dispatch(setChannelPercussionType(channelId, percussionType));
  },
  setChannelPan: (channelId, pan) => {
    dispatch(setChannelPan(channelId, pan));
  },
  setChannelPitchCoarse: (channelId, pitchCoarse) => {
    dispatch(setChannelPitchCoarse(channelId, pitchCoarse));
  },
  setChannelReverb: (channelId, reverb) => {
    dispatch(setChannelReverb(channelId, reverb));
  },
  setSampleAlignmentOffset: (sampleId, alignmentOffset) => {
    dispatch(setSampleAlignmentOffset({ sampleId, alignmentOffset }));
  },
  saveEditedUserSample: (
    channelId,
    audioBuffer,
    sourceName,
    sampleName,
    replaceSampleId,
  ) => (
    dispatch(saveEditedUserSample(
      channelId,
      audioBuffer,
      sourceName,
      sampleName,
      replaceSampleId,
    ) as unknown as AppAction) as unknown as Promise<void>
  ),
  updateChannelOrder: (oldIndex, newIndex) => {
    dispatch(updateChannelOrder(oldIndex, newIndex));
  },
});

const mergeProps = (
  stateProps: KitChannelListStateProps,
  dispatchProps: KitChannelListDispatchProps,
) => ({
  ...stateProps,
  onPressHitButton: (channel: LegacyChannel) => {
    playNoteNow(channel);
  },
  onPressRemove: (channel: LegacyChannel) => {
    if (!confirmChannelDelete(channel)) {
      return;
    }

    dispatchProps.deleteChannel(
      getKitChannelId(channel),
      stateProps.channels,
      stateProps.selectedChannelId,
      channel.id,
    );
  },
  onUpdateChannelOrder: (oldIndex: number, newIndex: number) => {
    dispatchProps.updateChannelOrder(oldIndex, newIndex);
  },
  onSetGain: (channel: LegacyChannel, event: Event) => {
    dispatchProps.setChannelGain(getKitChannelId(channel), getEventNumber(event) / 100);
  },
  onSetChannelName: (channel: LegacyChannel, name: string) => {
    dispatchProps.setChannelName(getKitChannelId(channel), name);
  },
  onSetPercussionType: (channel: LegacyChannel, percussionType: string) => {
    dispatchProps.setChannelPercussionType(getKitChannelId(channel), percussionType);
  },
  onSetPan: (channel: LegacyChannel, event: Event) => {
    dispatchProps.setChannelPan(getKitChannelId(channel), getEventNumber(event));
  },
  onSetChannelPitchCoarse: (channel: LegacyChannel, event: Event) => {
    dispatchProps.setChannelPitchCoarse(getKitChannelId(channel), getEventNumber(event));
  },
  onSetReverb: (channel: LegacyChannel, event: Event) => {
    dispatchProps.setChannelReverb(getKitChannelId(channel), getEventNumber(event));
  },
  onSetSampleAlignment: (channel: LegacyChannel, alignmentOffset: number) => {
    dispatchProps.setSampleAlignmentOffset(channel.sampleId, alignmentOffset);
  },
  onSaveEditedSample: (
    channel: LegacyChannel,
    audioBuffer: AudioBuffer,
    sampleName: string,
    replaceExisting: boolean,
  ) => (
    dispatchProps.saveEditedUserSample(
      getKitChannelId(channel),
      audioBuffer,
      channel.name || channel.sample || channel.id,
      sampleName,
      replaceExisting ? channel.sample : undefined,
    )
  ),
});

export const KitChannelList = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(KitChannelListComponent);
