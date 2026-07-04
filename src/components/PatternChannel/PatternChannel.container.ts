import { connect } from 'react-redux';
import { PatternChannelComponent } from './PatternChannel.component';
import { patternChannelSelectors } from './PatternChannel.selectors';
import {
  setSelectedChannel,
} from '../../common';
import { playNoteNow } from '../../services/audioScheduler';
import type { LegacyChannel } from '../../common';
import type { RootState } from '../../reducer';

type PatternChannelOwnProps = {
  channel: LegacyChannel;
};

type PatternChannelDispatchProps = {
  setSelectedChannel: (channelId: string) => void;
};

const mapStateToProps = (state: RootState) => patternChannelSelectors(state);

const mapDispatchToProps = {
  setSelectedChannel,
};

type PatternChannelStateProps = ReturnType<typeof mapStateToProps>;

const mergeProps = (
  stateProps: PatternChannelStateProps,
  dispatchProps: PatternChannelDispatchProps,
  ownProps: PatternChannelOwnProps,
) => ({
  ...stateProps,
  ...ownProps,
  onTouchChannel: () => {
    dispatchProps.setSelectedChannel(ownProps.channel.id);
  },
  onPressHitButton: () => {
    playNoteNow(ownProps.channel);
  },
});

export const PatternChannel = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PatternChannelComponent);
