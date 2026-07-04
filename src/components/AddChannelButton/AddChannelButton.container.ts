import { connect } from 'react-redux';
import { AddChannelButtonComponent } from './AddChannelButton.component';
import { newChannel } from '../../common';
import type { AppDispatch } from '../../store';

type AppAction = Parameters<AppDispatch>[0];

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  newChannel: () => {
    dispatch(newChannel() as unknown as AppAction);
  },
});

export const AddChannelButton = connect(
  null,
  mapDispatchToProps,
)(AddChannelButtonComponent);
