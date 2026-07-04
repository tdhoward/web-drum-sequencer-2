import { LOOKAHEAD } from './audioEngine.config';
import { getAudioContext } from './audioContext';
import { playNote } from './audioRouter';
import { notifyChannelTriggered } from './channelTriggerEvents';
import { sampleStore } from './sampleStore';
import { swing } from './swing';

type PitchInput = {
  pitchCoarse?: number;
  pitchFine?: number;
};

type NoteChannel = PitchInput & {
  id: string;
  sample?: string;
};

type ChannelNote = {
  id: string;
  beat: number;
};

type Tempo = {
  bpm: number;
  swing?: number;
};

type ScheduledNote = {
  id: string;
  time: number | null;
  channel: NoteChannel;
};

type GetScheduledNotesArgs = {
  channelNotes: ChannelNote[];
  channel: NoteChannel;
  startTime: number;
  tempo: Tempo;
  currentBeat: number;
  patternLengthInBeats?: number;
};

type ScheduleNotesArgs = {
  notes: Record<string, ChannelNote[][]>;
  channels: NoteChannel[];
  startTime: number;
  pattern: number;
  tempo: Tempo;
  currentBeat: number;
  patternLengthInBeats?: number;
};

// schedule is a lookup table of all the notes currently scheduled to be played
const schedule: Record<string, unknown> = {};
const visualTriggerSchedule: Record<string, ReturnType<typeof globalThis.setTimeout>> = {};

const getSampleBuffer = (noteChannel: NoteChannel): AudioBuffer | undefined => (
  typeof noteChannel.sample === 'undefined'
    ? undefined
    : sampleStore[noteChannel.sample]
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

export const scheduleNote = (noteId: string, noteTime: number, noteChannel: NoteChannel): void => {
  if (typeof schedule[noteId] === 'undefined') {
    const pitch = pitchToCents(noteChannel);
    schedule[noteId] = playNote(noteTime, getSampleBuffer(noteChannel), noteChannel.id, pitch);
    scheduleChannelTrigger(noteId, noteTime, noteChannel.id);
  }
};

export const clearScheduledNotes = (): void => {
  Object.keys(schedule).forEach((noteId) => {
    clearScheduledTrigger(noteId);
    delete schedule[noteId];
  });
  Object.keys(visualTriggerSchedule).forEach(clearScheduledTrigger);
};

export const isBetween = (query: number, a: number, b: number): boolean => query >= a && query < b;

export const getScheduledNotes = ({
  channelNotes,
  channel,
  startTime,
  tempo,
  currentBeat,
  patternLengthInBeats = 4,
}: GetScheduledNotesArgs): ScheduledNote[] => channelNotes.map(
  (note) => {
    const lookaheadBeats = LOOKAHEAD * (tempo.bpm / 60);

    const swingAmount = typeof tempo.swing === 'undefined' ? 0 : tempo.swing;
    const swingBeat = swing(note.beat, swingAmount);

    const noteTime = startTime + ((swingBeat - 1) * (60 / tempo.bpm));
    if (isBetween(note.beat, currentBeat, currentBeat + lookaheadBeats)) {
      return {
        id: note.id,
        time: noteTime,
        channel,
      };
    }
    // If nearing the end of the bar, schedule notes at the start of the bar too
    if (isBetween(
      note.beat,
      currentBeat - patternLengthInBeats,
      currentBeat + lookaheadBeats - patternLengthInBeats,
    )) {
      return {
        id: note.id,
        time: startTime + ((note.beat + patternLengthInBeats - 1) * 60 / tempo.bpm),
        channel,
      };
    }
    // Return note objects with time: null that should not be scheduled
    return {
      id: note.id,
      time: null,
      channel,
    };
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
      }),
    ], [],
  );

  // Schedule the notes
  notesToSchedule.forEach((note) => {
    if (note.time !== null) {
      scheduleNote(note.id, note.time, note.channel);
    } else {
      delete schedule[note.id];
    }
  });
};
