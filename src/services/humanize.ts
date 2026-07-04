const MAX_HUMANIZE_TIMING_SECONDS = 0.02;
const MAX_HUMANIZE_VELOCITY_SIGMA = 0.12;
const MAX_GAUSSIAN_DEVIATIONS = 3;
const MIN_VELOCITY_MULTIPLIER = 0.65;
const MAX_VELOCITY_MULTIPLIER = 1.15;

type HumanizeNoteArgs = {
  humanize?: number;
  seed: string;
  time: number;
  velocity: number;
};

type HumanizedNote = {
  time: number;
  velocity: number;
};

const clamp = (value: number, min: number, max: number): number => (
  Math.min(max, Math.max(min, value))
);

const getHumanizeDepth = (humanize = 0): number => {
  if (!Number.isFinite(humanize)) {
    return 0;
  }

  const clampedHumanize = clamp(humanize, 0, 1);
  return clampedHumanize ** 2;
};

const hashString = (value: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createSeededRandom = (seed: string): (() => number) => {
  let state = hashString(seed);

  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const gaussianFromSeed = (seed: string): number => {
  const random = createSeededRandom(seed);
  const u1 = Math.max(random(), Number.EPSILON);
  const u2 = random();

  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

export const humanizeNote = ({
  humanize = 0,
  seed,
  time,
  velocity,
}: HumanizeNoteArgs): HumanizedNote => {
  const depth = getHumanizeDepth(humanize);

  if (depth === 0) {
    return {
      time,
      velocity,
    };
  }

  const timingSigma = depth * MAX_HUMANIZE_TIMING_SECONDS;
  const velocitySigma = depth * MAX_HUMANIZE_VELOCITY_SIGMA;
  const timingOffset = clamp(
    gaussianFromSeed(`${seed}:timing`) * timingSigma,
    -MAX_GAUSSIAN_DEVIATIONS * timingSigma,
    MAX_GAUSSIAN_DEVIATIONS * timingSigma,
  );
  const velocityMultiplier = clamp(
    1 + gaussianFromSeed(`${seed}:velocity`) * velocitySigma,
    MIN_VELOCITY_MULTIPLIER,
    MAX_VELOCITY_MULTIPLIER,
  );

  return {
    time: time + timingOffset,
    velocity: Math.max(0, velocity * velocityMultiplier),
  };
};
