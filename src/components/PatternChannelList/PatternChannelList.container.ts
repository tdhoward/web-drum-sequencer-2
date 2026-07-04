import { connect } from 'react-redux';
import { PatternChannelListComponent } from './PatternChannelList.component';
import { patternChannelListSelectors } from './PatternChannelList.selectors';
import { updateChannelOrder } from '../../common';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => patternChannelListSelectors(state);

const mapDispatchToProps = {
  onUpdateChannelOrder: updateChannelOrder,
};

export const PatternChannelList = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PatternChannelListComponent);
