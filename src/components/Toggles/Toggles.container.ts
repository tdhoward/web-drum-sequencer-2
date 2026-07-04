import { connect } from 'react-redux';
import { TogglesComponent } from './Toggles.component';
import { toggleNote } from '../../common';
import { togglesSelectors } from './Toggles.selectors';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../reducer';

type AppAction = Parameters<AppDispatch>[0];

const mapStateToProps = (state: RootState) => togglesSelectors(state);

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  toggleNote: (channelId: string, pattern: number, beat: number) => {
    dispatch(toggleNote(channelId, pattern, beat) as unknown as AppAction);
  },
});

export const Toggles = connect(
  mapStateToProps,
  mapDispatchToProps,
)(TogglesComponent);
