import { connect } from 'react-redux';
import { FlashMessageComponent } from './FlashMessage.component';
import { clearFlashMessage } from '../../common';
import { flashMessageSelectors } from './FlashMessage.selectors';
import type { RootState } from '../../reducer';

type FlashMessageDispatchProps = {
  clearFlashMessage: () => void;
};

const mapDispatchToProps = {
  clearFlashMessage,
};

const mapStateToProps = (state: RootState) => flashMessageSelectors(state);

type FlashMessageStateProps = ReturnType<typeof mapStateToProps>;

const mergeProps = (
  stateProps: FlashMessageStateProps,
  dispatchProps: FlashMessageDispatchProps,
) => ({
  ...stateProps,
  onDismiss: dispatchProps.clearFlashMessage,
});

export const FlashMessage = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(FlashMessageComponent);
