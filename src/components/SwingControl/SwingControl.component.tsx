import React from 'react';
import { TempoKnobControl } from '../TempoKnobControl.component';

type SwingControlComponentProps = {
  onSetSwing: (event: Event) => void;
  swing: number;
};

export const SwingControlComponent = ({
  onSetSwing,
  swing,
}: SwingControlComponentProps) => (
  <TempoKnobControl label="SWING" onChange={onSetSwing} step="0.1" value={swing} />
);
