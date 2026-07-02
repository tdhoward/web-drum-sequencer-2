import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { PatternChannelComponent } from './PatternChannel.component';
import { patternChannelSelectors } from './PatternChannel.selectors';
import {
  setSelectedChannel,
} from '../../common';
import { playNoteNow } from '../../services/audioScheduler';

const mapDispatchToProps = {
  setSelectedChannel,
};

const handlers = withHandlers({
  onTouchChannel: props => () => {
    const { channel, setSelectedChannel: sscs } = props;
    sscs(channel.id);
  },
  onPressHitButton: props => () => {
    const { channel } = props;
    playNoteNow(channel);
  },
});

export const PatternChannel = compose(
  connect(patternChannelSelectors, mapDispatchToProps),
  handlers,
)(PatternChannelComponent);
