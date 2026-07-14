import { createSongTimeline } from './audioLoop';
import { createDefaultSequencerState } from '../common/defaultSequencerState';
import type { RootState } from '../reducer';

jest.mock('./audioContext');
jest.mock('./audioRouter');
jest.mock('./audioScheduler', () => ({
  clearScheduledNotes: jest.fn(),
  scheduleNotes: jest.fn(),
}));

describe('createSongTimeline', () => {
  test('preserves cleared arrangement columns as silent bars', () => {
    const state = {
      ...createDefaultSequencerState(),
      song: {
        ...createDefaultSequencerState().song,
        arrangementPatternIds: ['pattern-0', null, 'pattern-1'],
      },
      tempo: {
        bpm: 120,
        swing: 0,
        humanize: 0,
      },
    } as RootState;

    const timeline = createSongTimeline(state, 10);

    expect(timeline).toEqual([
      expect.objectContaining({
        index: 0,
        patternId: 'pattern-0',
        startTime: 10,
        endTime: 12,
        lengthInBeats: 4,
      }),
      expect.objectContaining({
        index: 1,
        patternId: null,
        pattern: null,
        startTime: 12,
        endTime: 14,
        lengthInBeats: 4,
      }),
      expect.objectContaining({
        index: 2,
        patternId: 'pattern-1',
        startTime: 14,
        endTime: 16,
        lengthInBeats: 4,
      }),
    ]);
  });
});
