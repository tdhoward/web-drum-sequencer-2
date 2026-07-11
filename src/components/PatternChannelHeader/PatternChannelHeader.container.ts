import { connect } from 'react-redux';
import { PatternChannelHeaderComponent } from './PatternChannelHeader.component';
import { patternChannelHeaderSelectors } from './PatternChannelHeader.selectors';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => patternChannelHeaderSelectors(state);

export const PatternChannelHeader = connect(mapStateToProps)(PatternChannelHeaderComponent);
