import { LOOKAHEAD } from './audioEngine.config';
import { DEFAULT_NOTE_VELOCITY, normalizeNoteVelocity } from '../common/sequencerModel';
import { getAudioContext } from './audioContext';
import { playNote } from './audioRouter';
import { notifyChannelTriggered } from './channelTriggerEvents';
import { humanizeNote } from './humanize';
import { sampleStore } from './sampleStore';
import { swing } from './swing';

type PitchInput = {
  pitchCoarse?: number;
  pitchFine?: number;
};

type NoteChannel = PitchInput & {
  id: string;
  sample?: string;
  alignmentOffset?: number;
};

type ChannelNote = {
  id: string;
  beat: number;
  velocity?: number;
};

type Tempo = {
  bpm: number;
  humanize?: number;
  swing?: number;
};

type ScheduledNote = {
  id: string;
  time: number | null;
  channel: NoteChannel;
  velocity: number;
};

type GetScheduledNotesArgs = {
  channelNotes: ChannelNote[];
  channel: NoteChannel;
  startTime: number;
  tempo: Tempo;
  currentBeat: number;
  patternLengthInBeats?: number;
  wrap?: boolean;
};

type ScheduleNotesArgs = {
  notes: Record<string, ChannelNote[][]>;
  channels: NoteChannel[];
  startTime: number;
  pattern: number;
  tempo: Tempo;
  currentBeat: number;
  patternLengthInBeats?: number;
  occurrenceKey?: string;
  wrap?: boolean;
};

type ScheduledSource = {
  source: AudioBufferSourceNode;
  playbackTime: number;
};

// schedule is a lookup table of all the notes currently scheduled to be played
const schedule: Record<string, ScheduledSource> = {};
const visualTriggerSchedule: Record<string, ReturnType<typeof globalThis.setTimeout>> = {};

const getSampleBuffer = (noteChannel: NoteChannel): AudioBuffer | undefined => (
  typeof noteChannel.sample === 'undefined'
    ? undefined
    : sampleStore[noteChannel.sample]
);

const getAlignmentOffset = (noteChannel: NoteChannel): number => (
  typeof noteChannel.alignmentOffset === 'number' && Number.isFinite(noteChannel.alignmentOffset)
    ? Math.max(0, noteChannel.alignmentOffset)
    : 0
);

export const pitchToCents = ({ pitchCoarse = 0, pitchFine = 0 }: PitchInput): number => Math.round(
  pitchCoarse * 100 + pitchFine,
);

export const playNoteNow = (noteChannel: NoteChannel): void => {
  const pitch = pitchToCents(noteChannel);
  playNote(null, getSampleBuffer(noteChannel), noteChannel.id, pitch);
  notifyChannelTriggered(noteChannel.id);
};

const clearScheduledTrigger = (noteId: string): void => {
  const visualTrigger = visualTriggerSchedule[noteId];

  if (typeof visualTrigger !== 'undefined') {
    globalThis.clearTimeout(visualTrigger);
    delete visualTriggerSchedule[noteId];
  }
};

const scheduleChannelTrigger = (
  noteId: string,
  noteTime: number,
  channelId: string,
): void => {
  clearScheduledTrigger(noteId);

  const delayMs = Math.max(
    0,
    (noteTime - getAudioContext().currentTime) * 1000,
  );

  visualTriggerSchedule[noteId] = globalThis.setTimeout(() => {
    delete visualTriggerSchedule[noteId];
    notifyChannelTriggered(channelId);
  }, delayMs);
};

export const scheduleNote = (
  noteId: string,
  noteTime: number,
  noteChannel: NoteChannel,
  noteVelocity = DEFAULT_NOTE_VELOCITY,
): void => {
  if (typeof schedule[noteId] === 'undefined') {
    const pitch = pitchToCents(noteChannel);
    const alignmentOffset = getAlignmentOffset(noteChannel);
    const playbackTime = Math.max(
      getAudioContext().currentTime,
      noteTime - alignmentOffset,
    );
    schedule[noteId] = {
      source: playNote(
        playbackTime,
        getSampleBuffer(noteChannel),
        noteChannel.id,
        pitch,
        noteVelocity,
      ),
      playbackTime,
    };
    scheduleChannelTrigger(noteId, noteTime, noteChannel.id);
  }
};

export const cancelScheduledNotesAfter = (audioTime: number): void => {
  Object.entries(schedule).forEach(([noteId, scheduled]) => {
    if (scheduled.playbackTime > audioTime) {
      try {
        scheduled.source.stop();
      } catch {
        // The source may have started or ended between the time check and stop.
      }
      clearScheduledTrigger(noteId);
      delete schedule[noteId];
    }
  });
};

export const clearScheduledNotes = (): void => {
  Object.keys(schedule).forEach((noteId) => {
    clearScheduledTrigger(noteId);
    delete schedule[noteId];
  });
  Object.keys(visualTriggerSchedule).forEach(clearScheduledTrigger);
};

export const isBetween = (query: number, a: number, b: number): boolean => query >= a && query < b;

const getNoteVelocity = (note: ChannelNote): number => normalizeNoteVelocity(note.velocity);

const getUnscheduledNote = (
  note: ChannelNote,
  channel: NoteChannel,
): ScheduledNote => ({
  id: note.id,
  time: null,
  channel,
  velocity: getNoteVelocity(note),
});

const isBeatInPattern = (beat: number, patternLengthInBeats: number): boolean => (
  isBetween(beat, 1, 1 + patternLengthInBeats)
);

const getHumanizeSeed = (
  note: ChannelNote,
  channel: NoteChannel,
  occurrenceStartTime: number,
): string => `${note.id}:${channel.id}:${Math.round(occurrenceStartTime * 1000)}`;

const getHumanizedScheduledNote = (
  note: ChannelNote,
  channel: NoteChannel,
  time: number,
  tempo: Tempo,
  occurrenceStartTime: number,
): ScheduledNote => {
  const humanizedNote = humanizeNote({
    humanize: tempo.humanize,
    seed: getHumanizeSeed(note, channel, occurrenceStartTime),
    time,
    velocity: getNoteVelocity(note),
  });

  return {
    id: note.id,
    time: humanizedNote.time,
    channel,
    velocity: humanizedNote.velocity,
  };
};

export const getScheduledNotes = ({
  channelNotes,
  channel,
  startTime,
  tempo,
  currentBeat,
  patternLengthInBeats = 4,
  wrap = true,
}: GetScheduledNotesArgs): ScheduledNote[] => channelNotes.map(
  (note) => {
    const lookaheadBeats = LOOKAHEAD * (tempo.bpm / 60);
    const secondsPerBeat = 60 / tempo.bpm;
    const alignmentBeats = getAlignmentOffset(channel) / secondsPerBeat;

    if (!isBeatInPattern(note.beat, patternLengthInBeats)) {
      return getUnscheduledNote(note, channel);
    }

    const swingAmount = typeof tempo.swing === 'undefined' ? 0 : tempo.swing;
    const swingBeat = swing(note.beat, swingAmount);

    const noteTime = startTime + ((swingBeat - 1) * secondsPerBeat);
    if (isBetween(note.beat, currentBeat, currentBeat + lookaheadBeats + alignmentBeats)) {
      return getHumanizedScheduledNote(note, channel, noteTime, tempo, startTime);
    }
    // If nearing the end of the bar, schedule notes at the start of the bar too
    if (wrap && isBetween(
      note.beat,
      currentBeat - patternLengthInBeats,
      // Alignment extends how far ahead the scheduler must inspect so playback
      // can begin before the wrapped beat.
      currentBeat + lookaheadBeats + alignmentBeats - patternLengthInBeats,
    )) {
      const nextPatternStartTime = startTime + (patternLengthInBeats * secondsPerBeat);
      const wrappedNoteTime = startTime
        + ((note.beat + patternLengthInBeats - 1) * secondsPerBeat);

      return getHumanizedScheduledNote(
        note,
        channel,
        wrappedNoteTime,
        tempo,
        nextPatternStartTime,
      );
    }
    // Return note objects with time: null that should not be scheduled
    return getUnscheduledNote(note, channel);
  },
);

export const scheduleNotes = ({
  notes,
  channels,
  startTime,
  pattern,
  tempo,
  currentBeat,
  patternLengthInBeats = 4,
  occurrenceKey,
  wrap = true,
}: ScheduleNotesArgs): void => {
  // Determine which notes need to be scheduled
  const notesToSchedule = channels.reduce<ScheduledNote[]>(
    (accumulator, channel) => [
      ...accumulator,
      ...getScheduledNotes({
        channelNotes: notes[channel.id][pattern], // Play the current pattern
        channel,
        startTime,
        tempo,
        currentBeat,
        patternLengthInBeats,
        wrap,
      }),
    ], [],
  );

  const occurrenceNotes = occurrenceKey
    ? notesToSchedule.map(note => ({ ...note, id: `${occurrenceKey}:${note.id}` }))
    : notesToSchedule;

  // Schedule the notes
  occurrenceNotes.forEach((note) => {
    if (note.time !== null) {
      scheduleNote(note.id, note.time, note.channel, note.velocity);
    } else {
      delete schedule[note.id];
    }
  });
};
