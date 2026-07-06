import { connect } from 'react-redux';
import { SwingControlComponent } from './SwingControl.component';
import { swingControlSelectors } from './SwingControl.selectors';
import { setSwing } from '../../common';
import type { RootState } from '../../reducer';

type SwingControlDispatchProps = {
  setSwing: (swing: number) => void;
};

type EventValueTarget = EventTarget & {
  value?: string | number;
};

const mapStateToProps = (state: RootState) => swingControlSelectors(state);

const mapDispatchToProps = { setSwing };

type SwingControlStateProps = ReturnType<typeof mapStateToProps>;

const getEventValue = (event: Event): number => Number(
  (event.target as EventValueTarget | null)?.value ?? 0,
);

const mergeProps = (
  stateProps: SwingControlStateProps,
  dispatchProps: SwingControlDispatchProps,
) => ({
  ...stateProps,
  onSetSwing: (event: Event) => {
    dispatchProps.setSwing(getEventValue(event));
  },
});

export const SwingControl = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SwingControlComponent);
