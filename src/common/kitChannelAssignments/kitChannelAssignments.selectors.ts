import type { KitChannelAssignmentsState } from '../sequencerModel';

const emptyAssignmentsState: KitChannelAssignmentsState = { ids: [], entities: {} };

type AssignmentsRootState = {
  kitChannelAssignments?: KitChannelAssignmentsState;
};

export const kitChannelAssignmentsSelector = (
  state: AssignmentsRootState,
): KitChannelAssignmentsState => (
  state.kitChannelAssignments || emptyAssignmentsState
);
