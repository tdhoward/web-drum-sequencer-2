import type { TempoState } from './tempo.reducer';

type TempoRootState = {
  tempo: TempoState;
};

export const bpmSelector = (state: TempoRootState): number => state.tempo.bpm;

export const swingSelector = (state: TempoRootState): number => state.tempo.swing;

export const humanizeSelector = (state: TempoRootState): number => state.tempo.humanize ?? 0;
