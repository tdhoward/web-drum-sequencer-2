import { connect } from 'react-redux';
import { MuteSoloComponent } from './MuteSolo.component';
import {
  setChannelMuted,
  setChannelSolo,
} from '../../common';

type MuteSoloChannel = {
  id: string;
  kitChannelId?: string;
  solo?: boolean;
  muted?: boolean;
};

type MuteSoloOwnProps = {
  channel: MuteSoloChannel;
};

type MuteSoloDispatchProps = {
  setChannelMuted: (channelId: string, muted: boolean) => void;
  setChannelSolo: (channelId: string, solo: boolean) => void;
};

const mapDispatchToProps = {
  setChannelMuted,
  setChannelSolo,
};

const getKitChannelId = (channel: MuteSoloChannel): string => channel.kitChannelId || channel.id;

const mergeProps = (
  _: unknown,
  dispatchProps: MuteSoloDispatchProps,
  ownProps: MuteSoloOwnProps,
) => ({
  ...ownProps,
  onPressMuted: () => {
    const { channel } = ownProps;
    dispatchProps.setChannelMuted(getKitChannelId(channel), !channel.muted);
  },
  onPressSolo: () => {
    const { channel } = ownProps;
    dispatchProps.setChannelSolo(getKitChannelId(channel), !channel.solo);
  },
});

export const MuteSolo = connect(
  null,
  mapDispatchToProps,
  mergeProps,
)(MuteSoloComponent);
