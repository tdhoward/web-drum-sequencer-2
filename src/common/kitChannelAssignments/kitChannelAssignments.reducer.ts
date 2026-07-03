import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createKitChannelAssignmentsState, DEFAULT_KIT_ID } from '../sequencerModel';
import type {
  KitChannelAssignment,
  KitChannelAssignmentsState,
  KitChannelInput,
} from '../sequencerModel';
import { createDefaultKitChannelAssignmentsState } from '../defaultSequencerState';
import { channelsSlice } from '../channels/channels.reducer';

export const kitChannelAssignmentsInitialState = createDefaultKitChannelAssignmentsState();

type ReplaceKitChannelAssignmentsPayload = {
  assignments: KitChannelAssignment[];
};

type SetKitChannelAssignmentPayload = {
  kitChannelId: string;
  laneId: string;
  confidence: string;
};

const channelToAssignment = (
  channel: KitChannelInput,
  kitId = DEFAULT_KIT_ID,
): KitChannelAssignment => ({
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
    replaceKitChannelAssignments(state, action: PayloadAction<ReplaceKitChannelAssignmentsPayload>) {
      state.ids = [];
      state.entities = {};
      action.payload.assignments.forEach((assignment) => {
        state.ids.push(assignment.id);
        state.entities[assignment.id] = assignment;
      });
    },
    setKitChannelAssignment: {
      reducer(state, action: PayloadAction<SetKitChannelAssignmentPayload>) {
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
      prepare(kitChannelId: string, laneId: string, confidence = 'manual') {
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
      .addCase(channelsSlice.actions.replaceChannels, (state, action): KitChannelAssignmentsState => (
        createKitChannelAssignmentsState(action.payload.channels, action.payload.kitId)
      ));
  },
});

export const {
  replaceKitChannelAssignments,
  setKitChannelAssignment,
} = kitChannelAssignmentsSlice.actions;

export const kitChannelAssignmentsReducer = kitChannelAssignmentsSlice.reducer;
