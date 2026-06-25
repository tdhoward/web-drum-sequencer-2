import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import {
  channelsSelector,
  setChannelGain,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelReverb,
  updateChannelOrder,
} from '../../common';
import { playNoteNow } from '../../services/audioScheduler';
import { KitChannelControlsComponent } from './KitChannelControls.component';

const getKitChannelId = channel => channel.kitChannelId || channel.id;

const mapStateToProps = state => ({
  channels: channelsSelector(state),
});

const mapDispatchToProps = {
  setChannelGain,
  setChannelPan,
  setChannelPitchCoarse,
  setChannelReverb,
  updateChannelOrder,
};

const handlers = withHandlers({
  onPressHitButton: () => (channel) => {
    playNoteNow(channel);
  },
  onUpdateChannelOrder: props => (oldIndex, newIndex) => {
    props.updateChannelOrder(oldIndex, newIndex);
  },
  onSetGain: props => (channel, e) => {
    props.setChannelGain(getKitChannelId(channel), e.target.value / 100);
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
