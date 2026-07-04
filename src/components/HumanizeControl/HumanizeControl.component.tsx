import React from 'react';
import { TempoKnobControl } from '../TempoKnobControl.component';

type HumanizeControlComponentProps = {
  humanize: number;
  onSetHumanize: (event: Event) => void;
};

export const HumanizeControlComponent = ({
  humanize,
  onSetHumanize,
}: HumanizeControlComponentProps) => (
  <TempoKnobControl label="HUMANIZE" onChange={onSetHumanize} value={humanize} />
);
