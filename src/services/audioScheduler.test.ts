import {
  isBetween,
  getScheduledNotes,
  scheduleNote,
  clearScheduledNotes,
} from './audioScheduler';
import { playNote } from './audioRouter';

jest.mock('./featureChecks');
jest.mock('./audioContext');
jest.mock('./audioRouter');

const mockedPlayNote = playNote as jest.Mock;

afterEach(() => {
  clearScheduledNotes();
  mockedPlayNote.mockClear();
});

describe('isBetween', () => {
  test('should return true if query is between a and b', () => {
    expect(isBetween(2, 1, 3)).toBe(true);
  });

  test('should return false if query is note between a and b', () => {
    expect(isBetween(4, 1, 3)).toBe(false);
  });
});

describe('getScheduledNotes', () => {
  const testNotes = [
    {
      beat: 1,
      id: 'foo',
    },
    {
      beat: 2.5,
      id: 'bar',
    },
    {
      beat: 4.25,
      id: 'bam',
    },
  ];

  const scheduledNotes = getScheduledNotes({
    channel: {
      id: 'test-channel',
      sample: '/whatever.wav',
    },
    channelNotes: testNotes,
    tempo: {
      bpm: 60,
      swing: 0.2,
    },
    startTime: 0,
    currentBeat: 1,
  });

  test('should return same number of notes', () => {
    expect(scheduledNotes.length).toBe(testNotes.length);
  });

  test('should calculate noteTime correctly for notes in the lookahead period', () => {
    expect(scheduledNotes[0].time).toBe(0);
  });

  test('should set noteTime to null if note should not be scheduled', () => {
    expect(scheduledNotes[1].time).toBeNull();
  });
});

describe('clearScheduledNotes', () => {
  test('should allow a note ID to be scheduled again after the schedule is cleared', () => {
    const channel = {
      id: 'kick',
      sample: 'kick.wav',
    };

    scheduleNote('note-1', 1, channel);
    scheduleNote('note-1', 2, channel);

    expect(mockedPlayNote).toHaveBeenCalledTimes(1);

    clearScheduledNotes();
    scheduleNote('note-1', 3, channel);

    expect(mockedPlayNote).toHaveBeenCalledTimes(2);
  });
});
