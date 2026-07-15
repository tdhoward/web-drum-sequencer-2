import {
  createSongTimeline,
  reanchorOccurrenceStartTime,
  scheduleSongOccurrence,
} from './audioLoop';
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

  test('uses each column tempo to calculate boundaries and inherited tempo', () => {
    const defaultState = createDefaultSequencerState();
    const state = {
      ...defaultState,
      song: {
        ...defaultState.song,
        arrangementPatternIds: [['pattern-0'], ['pattern-1'], ['pattern-2']],
        tempoChanges: [120, null, 60],
      },
      tempo: {
        bpm: 100,
        swing: 0,
        humanize: 0,
      },
    } as unknown as RootState;

    const timeline = createSongTimeline(state, 10);

    expect(timeline).toEqual([
      expect.objectContaining({ bpm: 120, startTime: 10, endTime: 12 }),
      expect.objectContaining({ bpm: 120, startTime: 12, endTime: 14 }),
      expect.objectContaining({ bpm: 60, startTime: 14, endTime: 18 }),
    ]);
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
      tempo: expect.objectContaining({ bpm: 120 }),
    }));
    expect(scheduleNotes).toHaveBeenNthCalledWith(2, expect.objectContaining({
      pattern: 1,
      patternLengthInBeats: 8,
      occurrenceKey: 'song-0-pattern-1',
      wrap: false,
    }));
  });
});

describe('live song tempo changes', () => {
  test('reanchors the occurrence so its current beat does not jump', () => {
    const audioTime = 11;
    const originalStart = 10;
    const currentBeatAt120 = 1 + ((audioTime - originalStart) * (120 / 60));
    const newStart = reanchorOccurrenceStartTime(originalStart, 120, 60, audioTime);
    const currentBeatAt60 = 1 + ((audioTime - newStart) * (60 / 60));

    expect(newStart).toBe(9);
    expect(currentBeatAt60).toBe(currentBeatAt120);
  });

  test('does not move a column that has not started yet', () => {
    expect(reanchorOccurrenceStartTime(10, 120, 90, 9.5)).toBe(10);
  });
});
