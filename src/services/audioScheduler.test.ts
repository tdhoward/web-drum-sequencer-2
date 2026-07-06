import {
  isBetween,
  getScheduledNotes,
  scheduleNote,
  clearScheduledNotes,
} from './audioScheduler';
import { MAX_NOTE_VELOCITY } from '../common/sequencerModel';
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

  test('should preserve note velocity when humanize is zero', () => {
    const humanizedNotes = getScheduledNotes({
      channel: {
        id: 'test-channel',
        sample: '/whatever.wav',
      },
      channelNotes: [
        {
          beat: 1,
          id: 'accent',
          velocity: 0.7,
        },
      ],
      tempo: {
        bpm: 60,
        humanize: 0,
      },
      startTime: 0,
      currentBeat: 1,
    });

    expect(humanizedNotes[0].time).toBe(0);
    expect(humanizedNotes[0].velocity).toBe(0.7);
  });

  test('should clamp authored note velocity before humanize', () => {
    const scheduledNotes = getScheduledNotes({
      channel: {
        id: 'test-channel',
        sample: '/whatever.wav',
      },
      channelNotes: [
        {
          beat: 1,
          id: 'too-loud',
          velocity: 10,
        },
      ],
      tempo: {
        bpm: 60,
        humanize: 0,
      },
      startTime: 0,
      currentBeat: 1,
    });

    expect(scheduledNotes[0].velocity).toBe(MAX_NOTE_VELOCITY);
  });

  test('should apply deterministic humanize timing and velocity', () => {
    const getHumanizedNotes = () => getScheduledNotes({
      channel: {
        id: 'test-channel',
        sample: '/whatever.wav',
      },
      channelNotes: [
        {
          beat: 1,
          id: 'kick',
          velocity: 1,
        },
      ],
      tempo: {
        bpm: 60,
        humanize: 1,
      },
      startTime: 20,
      currentBeat: 1,
    });

    const firstPass = getHumanizedNotes();
    const secondPass = getHumanizedNotes();

    expect(firstPass[0]).toEqual(secondPass[0]);
    expect(firstPass[0].time).toBeGreaterThanOrEqual(19.94);
    expect(firstPass[0].time).toBeLessThanOrEqual(20.06);
    expect(firstPass[0].velocity).toBeGreaterThanOrEqual(0.65);
    expect(firstPass[0].velocity).toBeLessThanOrEqual(1.15);
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

  test('passes note velocity to the audio router', () => {
    const channel = {
      id: 'kick',
      sample: 'kick.wav',
    };

    scheduleNote('note-velocity', 1, channel, 0.72);

    expect(mockedPlayNote).toHaveBeenCalledWith(1, undefined, 'kick', 0, 0.72);
  });
});
