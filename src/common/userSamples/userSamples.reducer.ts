import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type UserSample = string | {
  id: string;
  [key: string]: unknown;
};

export type UserSamplesState = UserSample[];

export const userSamplesInitialState: UserSamplesState = [];

const userSampleId = (userSample: UserSample): string | undefined => (
  typeof userSample === 'string' ? undefined : userSample.id
);

export const userSamplesSlice = createSlice({
  name: 'userSamples',
  initialState: userSamplesInitialState,
  reducers: {
    addUserSample(state, action: PayloadAction<UserSample>) {
      state.push(action.payload);
    },
    removeUserSample(state, action: PayloadAction<string>) {
      return state.filter(userSample => userSampleId(userSample) !== action.payload);
    },
    clearUserSamples() {
      return userSamplesInitialState;
    },
  },
});

export const userSamplesReducer = userSamplesSlice.reducer;
