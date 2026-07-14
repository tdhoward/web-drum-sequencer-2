import { createSongTimeline, scheduleSongOccurrence } from './audioLoop';
import { createDefaultSequencerState } from '../common/defaultSequencerState';
import { channelsSelector, notesSelector } from '../common';
import { scheduleNotes } from './audioScheduler';
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
        arrangementPatternIds: [['pattern-0'], [], ['pattern-1']],
      },
      tempo: {
        bpm: 120,
        swing: 0,
        humanize: 0,
      },
    } as unknown as RootState;

    const timeline = createSongTimeline(state, 10);

    expect(timeline).toEqual([
      expect.objectContaining({
        index: 0,
        patternIds: ['pattern-0'],
        startTime: 10,
        endTime: 12,
        lengthInBeats: 4,
      }),
      expect.objectContaining({
        index: 1,
        patternIds: [],
        patterns: [],
        startTime: 12,
        endTime: 14,
        lengthInBeats: 4,
      }),
      expect.objectContaining({
        index: 2,
        patternIds: ['pattern-1'],
        startTime: 14,
        endTime: 16,
        lengthInBeats: 4,
      }),
    ]);
  });

  test('plays multiple patterns together and uses the longest pattern as the column length', () => {
    const defaultState = createDefaultSequencerState();
    const state = {
      ...defaultState,
      song: {
        ...defaultState.song,
        arrangementPatternIds: [['pattern-0', 'pattern-1'], ['pattern-2']],
      },
      patterns: {
        ...defaultState.patterns,
        entities: {
          ...defaultState.patterns.entities,
          'pattern-1': {
            ...defaultState.patterns.entities['pattern-1'],
            bars: 2,
          },
        },
      },
      tempo: {
        bpm: 120,
        swing: 0,
        humanize: 0,
      },
    } as unknown as RootState;

    const timeline = createSongTimeline(state, 10);

    expect(timeline[0]).toEqual(expect.objectContaining({
      patternIds: ['pattern-0', 'pattern-1'],
      startTime: 10,
      endTime: 14,
      lengthInBeats: 8,
    }));
    expect(timeline[1]).toEqual(expect.objectContaining({
      startTime: 14,
      endTime: 16,
    }));
  });

  test('schedules every selected pattern once with its own length', () => {
    const defaultState = createDefaultSequencerState();
    const state = {
      ...defaultState,
      song: {
        ...defaultState.song,
        arrangementPatternIds: [['pattern-0', 'pattern-1']],
      },
      patterns: {
        ...defaultState.patterns,
        entities: {
          ...defaultState.patterns.entities,
          'pattern-1': {
            ...defaultState.patterns.entities['pattern-1'],
            bars: 2,
          },
        },
      },
      tempo: {
        bpm: 120,
        swing: 0,
        humanize: 0,
      },
    } as unknown as RootState;
    const occurrence = createSongTimeline(state, 10)[0];

    scheduleSongOccurrence(
      occurrence,
      10,
      state,
      notesSelector(state),
      channelsSelector(state),
    );

    expect(scheduleNotes).toHaveBeenCalledTimes(2);
    expect(scheduleNotes).toHaveBeenNthCalledWith(1, expect.objectContaining({
      pattern: 0,
      patternLengthInBeats: 4,
      occurrenceKey: 'song-0-pattern-0',
      wrap: false,
    }));
    expect(scheduleNotes).toHaveBeenNthCalledWith(2, expect.objectContaining({
      pattern: 1,
      patternLengthInBeats: 8,
      occurrenceKey: 'song-0-pattern-1',
      wrap: false,
    }));
  });
});
