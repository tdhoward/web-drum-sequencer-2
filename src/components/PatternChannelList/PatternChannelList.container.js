import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { PatternChannelListComponent } from './PatternChannelList.component';
import { patternChannelListSelectors } from './PatternChannelList.selectors';
import { updateChannelOrder } from '../../common';

const mapDispatchToProps = {
  updateChannelOrder,
};

const handlers = withHandlers({
  onUpdateChannelOrder: props => (oldIndex, newIndex) => {
    const { updateChannelOrder: updateChannelOrderConnected } = props;
    updateChannelOrderConnected(oldIndex, newIndex);
  },
});

export const PatternChannelList = compose(
  connect(patternChannelListSelectors, mapDispatchToProps),
  handlers,
)(PatternChannelListComponent);
