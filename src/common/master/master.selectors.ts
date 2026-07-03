import type { MasterState } from './master.reducer';

type MasterRootState = {
  master: MasterState;
};

export const selectedChannelSelector = (state: MasterRootState): string | undefined => (
  state.master.selectedChannel
);
