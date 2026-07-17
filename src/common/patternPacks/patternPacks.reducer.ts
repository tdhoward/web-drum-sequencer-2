import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import patternPacks from '../../patternPacks';
import type { PatternPack } from '../sequencerModel';

export type PatternPacksState = {
  selectedPatternPackId?: string;
  userPatternPacks?: PatternPack[];
};

export const patternPacksInitialState: PatternPacksState = {
  selectedPatternPackId: patternPacks[1]?.id || patternPacks[0]?.id,
  userPatternPacks: [],
};

export const patternPacksSlice = createSlice({
  name: 'patternPacks',
  initialState: patternPacksInitialState,
  reducers: {
    setSelectedPatternPack(state, action: PayloadAction<string>) {
      state.selectedPatternPackId = action.payload;
    },
    savePatternPack(state, action: PayloadAction<PatternPack>) {
      state.userPatternPacks = (state.userPatternPacks || []).map(
        userPatternPack => (userPatternPack.id === action.payload.id
          ? action.payload
          : userPatternPack),
      );
    },
    savePatternPackAs(state, action: PayloadAction<PatternPack>) {
      state.userPatternPacks = [
        ...(state.userPatternPacks || []).filter(
          userPatternPack => userPatternPack.id !== action.payload.id,
        ),
        action.payload,
      ];
    },
    renamePatternPack(state, action: PayloadAction<{ id: string; name: string }>) {
      const patternPack = (state.userPatternPacks || []).find(
        userPatternPack => userPatternPack.id === action.payload.id,
      );
      if (patternPack) patternPack.name = action.payload.name;
    },
    deletePatternPack(state, action: PayloadAction<string>) {
      state.userPatternPacks = (state.userPatternPacks || []).filter(
        userPatternPack => userPatternPack.id !== action.payload,
      );
    },
  },
});

export const {
  setSelectedPatternPack,
  savePatternPack,
  savePatternPackAs,
  renamePatternPack,
  deletePatternPack,
} = patternPacksSlice.actions;

export const patternPacksReducer = patternPacksSlice.reducer;
