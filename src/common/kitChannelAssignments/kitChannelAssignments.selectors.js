const emptyAssignmentsState = { ids: [], entities: {} };

export const kitChannelAssignmentsSelector = state => (
  state.kitChannelAssignments || emptyAssignmentsState
);
