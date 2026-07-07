import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type UserSampleRecord = {
  id: string;
  name: string;
  createdAt?: number;
  sourceName?: string;
  sourceType?: 'uploaded' | 'edited' | 'recorded';
  [key: string]: unknown;
};

export type UserSample = string | UserSampleRecord;

export type UserSamplesState = UserSample[];

export const userSamplesInitialState: UserSamplesState = [];

export const getUserSampleId = (userSample: UserSample): string => (
  typeof userSample === 'string' ? userSample : userSample.id
);

export const getUserSampleDisplayName = (userSample: UserSample): string => {
  if (typeof userSample === 'string') {
    return userSample;
  }

  return userSample.name?.trim() || userSample.id;
};

export const normalizeUserSample = (userSample: UserSample): UserSampleRecord => {
  if (typeof userSample === 'string') {
    return {
      id: userSample,
      name: userSample,
    };
  }

  return {
    ...userSample,
    name: userSample.name?.trim() || userSample.id,
  };
};

type AddUserSamplePayload = {
  id: string;
  name?: string;
  createdAt?: number;
  sourceName?: string;
  sourceType?: 'uploaded' | 'edited' | 'recorded';
};

type RenameUserSamplePayload = {
  id: string;
  name: string;
};

const upsertUserSample = (
  state: UserSamplesState,
  userSample: AddUserSamplePayload,
): void => {
  const nextUserSample = normalizeUserSample({
    ...userSample,
    name: userSample.name?.trim() || userSample.id,
  });
  const existingIndex = state.findIndex(sample => getUserSampleId(sample) === nextUserSample.id);

  if (existingIndex >= 0) {
    state[existingIndex] = {
      ...normalizeUserSample(state[existingIndex]),
      ...nextUserSample,
    };
    return;
  }

  state.push(nextUserSample);
};

const renameExistingUserSample = (
  state: UserSamplesState,
  { id, name }: RenameUserSamplePayload,
): void => {
  const nextName = name.trim();

  if (!nextName) {
    return;
  }

  const existingIndex = state.findIndex(userSample => getUserSampleId(userSample) === id);

  if (existingIndex >= 0) {
    state[existingIndex] = {
      ...normalizeUserSample(state[existingIndex]),
      name: nextName,
    };
  }
};

const createAddUserSamplePayload = (userSample: UserSample): AddUserSamplePayload => (
  typeof userSample === 'string'
    ? {
      id: userSample,
      name: userSample,
      createdAt: Date.now(),
    }
    : {
      ...userSample,
      name: userSample.name?.trim() || userSample.id,
      createdAt: userSample.createdAt || Date.now(),
    }
);

export const userSamplesSlice = createSlice({
  name: 'userSamples',
  initialState: userSamplesInitialState,
  reducers: {
    addUserSample: {
      reducer(state, action: PayloadAction<AddUserSamplePayload>) {
        upsertUserSample(state, action.payload);
      },
      prepare(userSample: UserSample) {
        return { payload: createAddUserSamplePayload(userSample) };
      },
    },
    renameUserSample: {
      reducer(state, action: PayloadAction<RenameUserSamplePayload>) {
        renameExistingUserSample(state, action.payload);
      },
      prepare(id: string, name: string) {
        return { payload: { id, name } };
      },
    },
    removeUserSample(state, action: PayloadAction<string>) {
      return state.filter(userSample => getUserSampleId(userSample) !== action.payload);
    },
    clearUserSamples() {
      return userSamplesInitialState;
    },
  },
});

export const userSamplesReducer = userSamplesSlice.reducer;
