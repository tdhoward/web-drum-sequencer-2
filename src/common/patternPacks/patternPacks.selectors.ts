import type { PatternPacksState } from './patternPacks.reducer';

type PatternPacksRootState = {
  patternPacks?: PatternPacksState;
};

export const selectedPatternPackIdSelector = (
  state: PatternPacksRootState,
): string | undefined => state.patternPacks?.selectedPatternPackId;
