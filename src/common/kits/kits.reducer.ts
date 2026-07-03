import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import { DEFAULT_KIT_ID } from '../sequencerModel';
import type { Kit, KitsState } from '../sequencerModel';
import { createDefaultKitsState } from '../defaultSequencerState';
import { channelsSlice } from '../channels/channels.reducer';

export const kitsInitialState = createDefaultKitsState();

type SetKitNamePayload = {
  kitId: string;
  name: string;
};

const getKit = (
  state: Draft<KitsState>,
  kitId = DEFAULT_KIT_ID,
): Draft<Kit> | undefined => state.entities[kitId];

const moveId = (ids: string[], oldIndex: number, newIndex: number): string[] => {
  const nextIds = [...ids];
  const [movedId] = nextIds.splice(oldIndex, 1);
  nextIds.splice(newIndex, 0, movedId);
  return nextIds;
};

export const kitsSlice = createSlice({
  name: 'kits',
  initialState: kitsInitialState,
  reducers: {
    setKitName: {
      reducer(state, action: PayloadAction<SetKitNamePayload>) {
        const kit = getKit(state, action.payload.kitId);
        if (kit) {
          kit.name = action.payload.name;
        }
      },
      prepare(kitId: string, name: string) {
        return { payload: { kitId, name } };
      },
    },
    replaceKit(state, action: PayloadAction<Kit>) {
      const kit = action.payload;
      if (!state.ids.includes(kit.id)) {
        state.ids.push(kit.id);
      }
      state.entities[kit.id] = kit;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(channelsSlice.actions.addChannel, (state, action) => {
        const kit = getKit(state, action.payload.kitId);
        if (kit && !kit.channelIds.includes(action.payload.id)) {
          kit.channelIds.push(action.payload.id);
        }
      })
      .addCase(channelsSlice.actions.removeChannel, (state, action) => {
        Object.values(state.entities).forEach((kit) => {
          kit.channelIds = kit.channelIds.filter(id => id !== action.payload);
        });
      })
      .addCase(channelsSlice.actions.updateChannelOrder, (state, action) => {
        Object.values(state.entities).forEach((kit) => {
          kit.channelIds = moveId(
            kit.channelIds,
            action.payload.oldIndex,
            action.payload.newIndex,
          );
        });
      })
      .addCase(channelsSlice.actions.replaceChannels, (state, action) => {
        const kitId = action.payload.kitId || DEFAULT_KIT_ID;
        const kit = getKit(state, kitId);
        const channelIds = action.payload.channels.map(channel => channel.id);
        if (kit) {
          kit.channelIds = channelIds;
        } else {
          state.ids.push(kitId);
          state.entities[kitId] = {
            id: kitId,
            name: 'Default Kit',
            channelIds,
          };
        }
      })
      .addCase(channelsSlice.actions.replaceKitChannels, (state, action) => {
        const kitId = action.payload.kitId || DEFAULT_KIT_ID;
        const kit = getKit(state, kitId);
        const channelIds = action.payload.channels.map(channel => channel.id);
        if (kit) {
          kit.channelIds = channelIds;
        } else {
          state.ids.push(kitId);
          state.entities[kitId] = {
            id: kitId,
            name: 'Default Kit',
            channelIds,
          };
        }
      });
  },
});

export const {
  setKitName,
  replaceKit,
} = kitsSlice.actions;

export const kitsReducer = kitsSlice.reducer;
