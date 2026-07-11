import type { TimeSignature } from './sequencerModel';

export type TimeSignaturePreset = {
  id: string;
  label: string;
  timeSignature: TimeSignature;
  stepsPerBeat: number;
};

export const DEFAULT_TIME_SIGNATURE_ID = '4/4';

export const COMMON_TIME_SIGNATURES: TimeSignaturePreset[] = [
  {
    id: DEFAULT_TIME_SIGNATURE_ID,
    label: '4/4',
    timeSignature: {
      beatsPerBar: 4,
      beatUnit: 4,
    },
    stepsPerBeat: 4,
  },
  {
    id: '3/4',
    label: '3/4',
    timeSignature: {
      beatsPerBar: 3,
      beatUnit: 4,
    },
    stepsPerBeat: 4,
  },
  {
    id: '2/4',
    label: '2/4',
    timeSignature: {
      beatsPerBar: 2,
      beatUnit: 4,
    },
    stepsPerBeat: 4,
  },
  {
    id: '6/8',
    label: '6/8',
    timeSignature: {
      beatsPerBar: 6,
      beatUnit: 8,
    },
    stepsPerBeat: 2,
  },
  {
    id: '12/8',
    label: '12/8',
    timeSignature: {
      beatsPerBar: 12,
      beatUnit: 8,
    },
    stepsPerBeat: 2,
  },
  {
    id: '5/4',
    label: '5/4',
    timeSignature: {
      beatsPerBar: 5,
      beatUnit: 4,
    },
    stepsPerBeat: 4,
  },
  {
    id: '7/8',
    label: '7/8',
    timeSignature: {
      beatsPerBar: 7,
      beatUnit: 8,
    },
    stepsPerBeat: 2,
  },
  {
    id: '9/8',
    label: '9/8',
    timeSignature: {
      beatsPerBar: 9,
      beatUnit: 8,
    },
    stepsPerBeat: 2,
  },
];

export const formatTimeSignature = ({ beatsPerBar, beatUnit }: TimeSignature): string => (
  `${beatsPerBar}/${beatUnit}`
);

export const getTimeSignatureId = formatTimeSignature;

export const findTimeSignaturePreset = (
  timeSignature: TimeSignature,
): TimeSignaturePreset | undefined => {
  const timeSignatureId = getTimeSignatureId(timeSignature);
  return COMMON_TIME_SIGNATURES.find(preset => preset.id === timeSignatureId);
};
