import { humanizeNote } from './humanize';

describe('humanizeNote', () => {
  test('leaves time and velocity unchanged when humanize is zero', () => {
    expect(humanizeNote({
      humanize: 0,
      seed: 'kick-1',
      time: 12,
      velocity: 0.8,
    })).toEqual({
      time: 12,
      velocity: 0.8,
    });
  });

  test('returns deterministic timing and velocity for the same seed', () => {
    const note = {
      humanize: 1,
      seed: 'kick-1:pattern-start',
      time: 12,
      velocity: 1,
    };

    expect(humanizeNote(note)).toEqual(humanizeNote(note));
  });

  test('keeps maximum humanize inside bounded timing and velocity ranges', () => {
    const humanizedNote = humanizeNote({
      humanize: 1,
      seed: 'snare-2:pattern-start',
      time: 12,
      velocity: 1,
    });

    expect(humanizedNote.time).toBeGreaterThanOrEqual(11.94);
    expect(humanizedNote.time).toBeLessThanOrEqual(12.06);
    expect(humanizedNote.velocity).toBeGreaterThanOrEqual(0.65);
    expect(humanizedNote.velocity).toBeLessThanOrEqual(1.15);
  });
});
