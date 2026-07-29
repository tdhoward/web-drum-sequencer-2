import {
  isBetween,
  getScheduledNotes,
  playNoteNow,
  scheduleNote,
  cancelScheduledNotesAfter,
  clearScheduledNotes,
  scheduleNotes,
} from './audioScheduler';
import { MAX_NOTE_VELOCITY } from '../common/sequencerModel';
import { playNote } from './audioRouter';
import { sampleStore } from './sampleStore';

jest.mock('./featureChecks');
jest.mock('./audioContext');
jest.mock('./audioRouter');

const mockedPlayNote = playNote as jest.Mock;

const createSingleLayerChannel = (
  id = 'test-channel',
  sample = '/whatever.wav',
  alignmentOffset = 0,
) => ({
  id,
  velocityLayers: [{
    id: `${id}:layer:1`,
    sampleId: `sample:${sample}`,
    sample,
    maxVelocity: 127,
    alignmentOffset,
    trimDb: 0,
  }],
});

afterEach(() => {
  clearScheduledNotes();
  mockedPlayNote.mockClear();
  delete sampleStore['soft.wav'];
  delete sampleStore['hard.wav'];
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
    channel: createSingleLayerChannel(),
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

  test('should not schedule notes outside the active pattern length', () => {
    const scheduledThreeFourNotes = getScheduledNotes({
      channel: createSingleLayerChannel(),
      channelNotes: [
        {
          beat: 3.75,
          id: 'visible-last-sixteenth',
        },
        {
          beat: 4,
          id: 'hidden-fourth-beat',
        },
        {
          beat: 4.25,
          id: 'hidden-fourth-beat-second-sixteenth',
        },
        {
          beat: 1,
          id: 'wrapped-first-beat',
        },
      ],
      tempo: {
        bpm: 120,
      },
      startTime: 0,
      currentBeat: 3.7,
      patternLengthInBeats: 3,
    });

    expect(scheduledThreeFourNotes[0]).toEqual(expect.objectContaining({
      id: 'visible-last-sixteenth',
    }));
    expect(scheduledThreeFourNotes[0].time).not.toBeNull();
    expect(scheduledThreeFourNotes[1]).toEqual(expect.objectContaining({
      id: 'hidden-fourth-beat',
      time: null,
    }));
    expect(scheduledThreeFourNotes[2]).toEqual(expect.objectContaining({
      id: 'hidden-fourth-beat-second-sixteenth',
      time: null,
    }));
    expect(scheduledThreeFourNotes[3]).toEqual(expect.objectContaining({
      id: 'wrapped-first-beat',
      time: 1.5,
    }));
  });

  test('should preserve note velocity when humanize is zero', () => {
    const humanizedNotes = getScheduledNotes({
      channel: createSingleLayerChannel(),
      channelNotes: [
        {
          beat: 1,
          id: 'accent',
          velocity: 72,
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
    expect(humanizedNotes[0].velocity).toBe(72);
  });

  test('should clamp authored note velocity before humanize', () => {
    const scheduledNotes = getScheduledNotes({
      channel: createSingleLayerChannel(),
      channelNotes: [
        {
          beat: 1,
          id: 'too-loud',
          velocity: 500,
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
      channel: createSingleLayerChannel(),
      channelNotes: [
        {
          beat: 1,
          id: 'kick',
          velocity: 64,
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
    expect(firstPass[0].velocity).toBeGreaterThanOrEqual(0);
    expect(firstPass[0].velocity).toBeLessThanOrEqual(127);
    expect(Number.isInteger(firstPass[0].velocity)).toBe(true);
  });
});

describe('clearScheduledNotes', () => {
  test('should allow a note ID to be scheduled again after the schedule is cleared', () => {
    const channel = createSingleLayerChannel('kick', 'kick.wav');

    scheduleNote('note-1', 1, channel);
    scheduleNote('note-1', 2, channel);

    expect(mockedPlayNote).toHaveBeenCalledTimes(1);

    clearScheduledNotes();
    scheduleNote('note-1', 3, channel);

    expect(mockedPlayNote).toHaveBeenCalledTimes(2);
  });

  test('passes note velocity to the audio router', () => {
    const channel = createSingleLayerChannel('kick', 'kick.wav');

    scheduleNote('note-velocity', 1, channel, 32);

    expect(mockedPlayNote).toHaveBeenCalledWith(1, undefined, 'kick', 0, 32, 0);
  });

  test('selects exactly one sample on either side of a velocity boundary', () => {
    const softBuffer = {} as AudioBuffer;
    const hardBuffer = {} as AudioBuffer;
    sampleStore['soft.wav'] = softBuffer;
    sampleStore['hard.wav'] = hardBuffer;
    const channel = {
      id: 'snare',
      velocityLayers: [
        {
          id: 'soft',
          sampleId: 'soft',
          sample: 'soft.wav',
          maxVelocity: 63,
          alignmentOffset: 0.1,
          trimDb: -3,
        },
        {
          id: 'hard',
          sampleId: 'hard',
          sample: 'hard.wav',
          maxVelocity: 127,
          alignmentOffset: 0.02,
          trimDb: -1,
        },
      ],
    };

    scheduleNote('soft-note', 2, channel, 63);
    scheduleNote('hard-note', 2, channel, 64);

    expect(mockedPlayNote).toHaveBeenNthCalledWith(
      1,
      1.9,
      softBuffer,
      'snare',
      0,
      63,
      -3,
    );
    expect(mockedPlayNote).toHaveBeenNthCalledWith(
      2,
      1.98,
      hardBuffer,
      'snare',
      0,
      64,
      -1,
    );
  });

  test('does not create a voice for silent velocity zero', () => {
    scheduleNote('silent-note', 2, {
      id: 'kick',
      velocityLayers: [{
        id: 'main',
        sampleId: 'kick',
        sample: 'kick.wav',
        maxVelocity: 127,
        alignmentOffset: 0,
        trimDb: 0,
      }],
    }, 0);

    expect(mockedPlayNote).not.toHaveBeenCalled();
  });

  test('uses humanized velocity for both boundary crossing and voice gain', () => {
    const softBuffer = {} as AudioBuffer;
    const hardBuffer = {} as AudioBuffer;
    sampleStore['soft.wav'] = softBuffer;
    sampleStore['hard.wav'] = hardBuffer;

    scheduleNotes({
      notes: {
        'test-channel': [[{
          id: 'kick',
          beat: 1,
          velocity: 64,
        }]],
      },
      channels: [{
        id: 'test-channel',
        velocityLayers: [
          {
            id: 'soft',
            sampleId: 'soft',
            sample: 'soft.wav',
            maxVelocity: 70,
            alignmentOffset: 0,
            trimDb: 0,
          },
          {
            id: 'hard',
            sampleId: 'hard',
            sample: 'hard.wav',
            maxVelocity: 127,
            alignmentOffset: 0,
            trimDb: -2,
          },
        ],
      }],
      startTime: 20,
      pattern: 0,
      tempo: { bpm: 60, humanize: 1 },
      currentBeat: 1,
    });

    expect(mockedPlayNote).toHaveBeenCalledTimes(1);
    expect(mockedPlayNote).toHaveBeenCalledWith(
      expect.any(Number),
      hardBuffer,
      'test-channel',
      0,
      74,
      -2,
    );
  });

  test('Hit audition uses velocity 64 and its reference layer', () => {
    const softBuffer = {} as AudioBuffer;
    const hardBuffer = {} as AudioBuffer;
    sampleStore['soft.wav'] = softBuffer;
    sampleStore['hard.wav'] = hardBuffer;

    playNoteNow({
      id: 'snare',
      velocityLayers: [
        {
          id: 'soft',
          sampleId: 'soft',
          sample: 'soft.wav',
          maxVelocity: 63,
          alignmentOffset: 0,
          trimDb: -3,
        },
        {
          id: 'hard',
          sampleId: 'hard',
          sample: 'hard.wav',
          maxVelocity: 127,
          alignmentOffset: 0,
          trimDb: -1,
        },
      ],
    });

    expect(mockedPlayNote).toHaveBeenCalledTimes(1);
    expect(mockedPlayNote).toHaveBeenCalledWith(
      null,
      hardBuffer,
      'snare',
      0,
      64,
      -1,
    );
  });
});

describe('cancelScheduledNotesAfter', () => {
  test('stops and releases only sources that have not started', () => {
    const futureSource = { stop: jest.fn() };
    const startedSource = { stop: jest.fn() };
    mockedPlayNote
      .mockReturnValueOnce(futureSource)
      .mockReturnValueOnce(startedSource);
    const channel = createSingleLayerChannel('kick', 'kick.wav');

    scheduleNote('future-note', 2, channel);
    scheduleNote('started-note', 1, channel);
    cancelScheduledNotesAfter(1);

    expect(futureSource.stop).toHaveBeenCalledTimes(1);
    expect(startedSource.stop).not.toHaveBeenCalled();

    scheduleNote('future-note', 3, channel);
    scheduleNote('started-note', 3, channel);
    expect(mockedPlayNote).toHaveBeenCalledTimes(3);
  });
});

describe('song occurrence scheduling', () => {
  test('can schedule the same pattern note in adjacent occurrences', () => {
    const args = {
      notes: { kick: [[{ id: 'note-1', beat: 1 }]] },
      channels: [createSingleLayerChannel('kick', 'kick.wav')],
      tempo: { bpm: 120, humanize: 0 },
      pattern: 0,
      patternLengthInBeats: 4,
      currentBeat: 1,
      wrap: false,
    };

    scheduleNotes({ ...args, startTime: 1, occurrenceKey: 'song-0' });
    scheduleNotes({ ...args, startTime: 3, occurrenceKey: 'song-1' });

    expect(mockedPlayNote).toHaveBeenCalledTimes(2);
  });

  test('looks ahead far enough to start an aligned sample before its beat', () => {
    const alignedNotes = getScheduledNotes({
      channel: createSingleLayerChannel('test-channel', '/whatever.wav', 0.2),
      channelNotes: [{ beat: 1.2, id: 'early-attack' }],
      tempo: { bpm: 60, humanize: 0 },
      startTime: 10,
      currentBeat: 1,
    });

    expect(alignedNotes[0].time).not.toBeNull();
  });

  test('uses the longest layer alignment for scheduler lookahead', () => {
    const alignedNotes = getScheduledNotes({
      channel: {
        id: 'test-channel',
        velocityLayers: [
          {
            id: 'soft',
            sampleId: 'soft',
            maxVelocity: 63,
            alignmentOffset: 0.2,
            trimDb: 0,
          },
          {
            id: 'hard',
            sampleId: 'hard',
            maxVelocity: 127,
            alignmentOffset: 0,
            trimDb: 0,
          },
        ],
      },
      channelNotes: [{ beat: 1.2, id: 'reference-layer-hit', velocity: 64 }],
      tempo: { bpm: 60, humanize: 0 },
      startTime: 10,
      currentBeat: 1,
    });

    expect(alignedNotes[0].time).not.toBeNull();
  });

  test('starts playback early by the sample alignment offset', () => {
    scheduleNote(
      'aligned-note',
      2,
      createSingleLayerChannel('snare', 'snare.wav', 0.126),
    );

    expect(mockedPlayNote).toHaveBeenCalledWith(1.874, undefined, 'snare', 0, 64, 0);
  });

  test('zero alignment preserves timing and startup never schedules negative audio time', () => {
    scheduleNote('zero-note', 2, createSingleLayerChannel('kick', 'kick.wav'));
    scheduleNote(
      'startup-note',
      0.08,
      createSingleLayerChannel('snare', 'snare.wav', 0.2),
    );

    expect(mockedPlayNote).toHaveBeenNthCalledWith(1, 2, undefined, 'kick', 0, 64, 0);
    expect(mockedPlayNote).toHaveBeenNthCalledWith(2, 1, undefined, 'snare', 0, 64, 0);
  });
});
