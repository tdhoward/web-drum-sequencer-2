import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import {
  channelsSelector,
  deleteChannel,
  selectedChannelSelector,
  setChannelGain,
  setChannelName,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelReverb,
  updateChannelOrder,
} from '../../common';
import { playNoteNow } from '../../services/audioScheduler';
import { KitChannelControlsComponent } from './KitChannelControls.component';

const getKitChannelId = channel => channel.kitChannelId || channel.id;

const confirmChannelDelete = (channel) => {
  const channelName = channel.name || channel.id;
  return window.confirm(`Delete channel "${channelName}"? This will also remove its notes from the current song.`);
};

const mapStateToProps = state => ({
  channels: channelsSelector(state),
  selectedChannelId: selectedChannelSelector(state),
});

const mapDispatchToProps = {
  deleteChannel,
  setChannelGain,
  setChannelName,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelReverb,
  updateChannelOrder,
};

const handlers = withHandlers({
  onPressHitButton: () => (channel) => {
    playNoteNow(channel);
  },
  onPressRemove: props => (channel) => {
    if (!confirmChannelDelete(channel)) {
      return;
    }

    props.deleteChannel(
      getKitChannelId(channel),
      props.channels,
      props.selectedChannelId,
      channel.id,
    );
  },
  onUpdateChannelOrder: props => (oldIndex, newIndex) => {
    props.updateChannelOrder(oldIndex, newIndex);
  },
  onSetGain: props => (channel, e) => {
    props.setChannelGain(getKitChannelId(channel), e.target.value / 100);
  },
  onSetChannelName: props => (channel, name) => {
    props.setChannelName(getKitChannelId(channel), name);
  },
  onSetPan: props => (channel, e) => {
    props.setChannelPan(getKitChannelId(channel), e.target.value);
  },
  onSetChannelPitchCoarse: props => (channel, e) => {
    props.setChannelPitchCoarse(getKitChannelId(channel), e.target.value);
  },
  onSetReverb: props => (channel, e) => {
    props.setChannelReverb(getKitChannelId(channel), e.target.value);
  },
});

export const KitChannelControls = compose(
  connect(mapStateToProps, mapDispatchToProps),
  handlers,
)(KitChannelControlsComponent);
