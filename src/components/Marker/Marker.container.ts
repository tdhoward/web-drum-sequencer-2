import { connect } from 'react-redux';
import { MarkerComponent } from './Marker.component';
import { markerSelectors } from './Marker.selectors';
import type { RootState } from '../../reducer';

const mapStateToProps = (state: RootState) => markerSelectors(state);

export const Marker = connect(mapStateToProps)(MarkerComponent);
