import { getTempoPulseState } from './BPMInput.component';

describe('BPM tempo pulse', () => {
  test('distinguishes a bar downbeat from the other beats', () => {
    expect(getTempoPulseState(120, 10, 10, 4)).toEqual({
      downbeat: true,
      pulse: 1,
    });
    expect(getTempoPulseState(120, 10, 10.5, 4)).toEqual({
      downbeat: false,
      pulse: 1,
    });
  });

  test('pulses at fractional-quarter-beat bar boundaries', () => {
    expect(getTempoPulseState(120, 10, 11.25, 2.5)).toEqual({
      downbeat: true,
      pulse: 1,
    });
  });
});
