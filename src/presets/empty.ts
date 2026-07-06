import samples from '../samples.config';
import type { FactoryPreset } from '../common/sequencerModel';

export const EMPTY_NOTE_ROW = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
];

const preset = {
  name: 'Empty',
  bpm: 80,
  swing: 0,
  channels: [
    {
      id: 'bass_drum',
      name: 'Bass Drum',
      percussionType: 'bass_drum',
      register: 'low',
      sample: samples[0].url,
      gain: 1,
    },
  ],
  notes: {
    bass_drum: EMPTY_NOTE_ROW,
  },
} satisfies FactoryPreset;

export default preset;
