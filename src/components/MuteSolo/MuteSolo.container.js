import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { MuteSoloComponent } from './MuteSolo.component';
import {
  setChannelMuted,
  setChannelSolo,
} from '../../common';

const mapDispatchToProps = {
  setChannelMuted,
  setChannelSolo,
};

const getKitChannelId = channel => channel.kitChannelId || channel.id;

const handlers = withHandlers({
  onPressMuted: props => () => {
    const { channel, setChannelMuted: setChannelMutedConnected } = props;
    setChannelMutedConnected(getKitChannelId(channel), !channel.muted);
  },
  onPressSolo: props => () => {
    const { channel, setChannelSolo: setChannelSoloConnected } = props;
    setChannelSoloConnected(getKitChannelId(channel), !channel.solo);
  },
});

export const MuteSolo = compose(
  connect(null, mapDispatchToProps),
  handlers,
)(MuteSoloComponent);
