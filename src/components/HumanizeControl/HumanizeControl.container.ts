import { connect } from 'react-redux';
import { HumanizeControlComponent } from './HumanizeControl.component';
import { humanizeControlSelectors } from './HumanizeControl.selectors';
import { setHumanize } from '../../common';
import type { RootState } from '../../reducer';

type HumanizeControlDispatchProps = {
  setHumanize: (humanize: number) => void;
};

type EventValueTarget = EventTarget & {
  value?: string | number;
};

const mapStateToProps = (state: RootState) => humanizeControlSelectors(state);

const mapDispatchToProps = { setHumanize };

type HumanizeControlStateProps = ReturnType<typeof mapStateToProps>;

const getEventValue = (event: Event): number => Number(
  (event.target as EventValueTarget | null)?.value ?? 0,
);

const mergeProps = (
  stateProps: HumanizeControlStateProps,
  dispatchProps: HumanizeControlDispatchProps,
) => ({
  ...stateProps,
  onSetHumanize: (event: Event) => {
    dispatchProps.setHumanize(getEventValue(event));
  },
});

export const HumanizeControl = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(HumanizeControlComponent);
