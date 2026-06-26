import { createSlice } from '@reduxjs/toolkit';
import { createKitChannelAssignmentsState, DEFAULT_KIT_ID } from '../sequencerModel';
import { createDefaultKitChannelAssignmentsState } from '../defaultSequencerState';
import { channelsSlice } from '../channels/channels.reducer';

export const kitChannelAssignmentsInitialState = createDefaultKitChannelAssignmentsState();

const channelToAssignment = (channel, kitId = DEFAULT_KIT_ID) => ({
  id: channel.id,
  kitId: channel.kitId || kitId,
  laneId: channel.laneId || channel.id,
  kitChannelId: channel.id,
  confidence: channel.assignmentConfidence || 'manual',
});

export const kitChannelAssignmentsSlice = createSlice({
  name: 'kitChannelAssignments',
  initialState: kitChannelAssignmentsInitialState,
  reducers: {
    setKitChannelAssignment: {
      reducer(state, action) {
        const {
          kitChannelId,
          laneId,
          confidence,
        } = action.payload;
        const assignment = state.entities[kitChannelId];
        if (assignment) {
          assignment.laneId = laneId;
          assignment.confidence = confidence;
        }
      },
      prepare(kitChannelId, laneId, confidence = 'manual') {
        return {
          payload: {
            kitChannelId,
            laneId,
            confidence,
          },
        };
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(channelsSlice.actions.addChannel, (state, action) => {
        const assignment = channelToAssignment(action.payload);
        state.ids.push(assignment.id);
        state.entities[assignment.id] = assignment;
      })
      .addCase(channelsSlice.actions.removeChannel, (state, action) => {
        state.ids = state.ids.filter(id => id !== action.payload);
        delete state.entities[action.payload];
      })
      .addCase(channelsSlice.actions.replaceChannels, (state, action) => (
        createKitChannelAssignmentsState(action.payload.channels, action.payload.kitId)
      ));
  },
});

export const {
  setKitChannelAssignment,
} = kitChannelAssignmentsSlice.actions;

export const kitChannelAssignmentsReducer = kitChannelAssignmentsSlice.reducer;
