import type { UserSamplesState } from './userSamples.reducer';

type UserSamplesRootState = {
  userSamples?: UserSamplesState;
};

export const userSamplesSelector = (state: UserSamplesRootState): UserSamplesState | undefined => (
  state.userSamples
);
