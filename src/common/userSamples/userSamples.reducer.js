import { createSlice } from '@reduxjs/toolkit';

export const userSamplesInitialState = [];

export const userSamplesSlice = createSlice({
  name: 'userSamples',
  initialState: userSamplesInitialState,
  reducers: {
    addUserSample(state, action) {
      state.push(action.payload);
    },
    removeUserSample(state, action) {
      return state.filter(userSample => userSample.id !== action.payload);
    },
    clearUserSamples() {
      return userSamplesInitialState;
    },
  },
});

export const userSamplesReducer = userSamplesSlice.reducer;
