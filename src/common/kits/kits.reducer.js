import { createSlice } from '@reduxjs/toolkit';
import presets from '../../presets';
import { DEFAULT_KIT_ID, createKitsState } from '../sequencerModel';
import { channelsSlice } from '../channels/channels.reducer';

export const kitsInitialState = createKitsState(presets[1].channels, DEFAULT_KIT_ID);

const getKit = (state, kitId = DEFAULT_KIT_ID) => state.entities[kitId];

const moveId = (ids, oldIndex, newIndex) => {
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
      reducer(state, action) {
        const kit = getKit(state, action.payload.kitId);
        if (kit) {
          kit.name = action.payload.name;
        }
      },
      prepare(kitId, name) {
        return { payload: { kitId, name } };
      },
    },
    replaceKit(state, action) {
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
      });
  },
});

export const {
  setKitName,
  replaceKit,
} = kitsSlice.actions;

export const kitsReducer = kitsSlice.reducer;
