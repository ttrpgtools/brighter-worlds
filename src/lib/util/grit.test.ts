import { describe, expect, it } from 'vitest';
import { calculateGrit, gritAfterMaximumChange } from './grit';

describe('Grit and explicit maximum Attribute edits', () => {
  it('calculates the six legal starting assignments', () => {
    expect(
      [
        [4, 6],
        [4, 8],
        [6, 4],
        [6, 8],
        [8, 4],
        [8, 6],
      ].map(([d, w]) => calculateGrit(d as 4, w as 4)),
    ).toEqual([2, 3, 2, 4, 3, 4]);
  });

  it('adds only the DEX/WIL step delta, preserving custom or older maxima', () => {
    const grit = { current: 3, max: 7 };
    expect(gritAfterMaximumChange(grit, 'dex', 4, 8)).toEqual({ current: 3, max: 9 });
    expect(gritAfterMaximumChange(grit, 'wil', 6, 8)).toEqual({ current: 3, max: 8 });
    expect(grit).toEqual({ current: 3, max: 7 });
  });

  it('clamps current Grit on a reduced maximum without restoring spent Grit', () => {
    expect(gritAfterMaximumChange({ current: 5, max: 5 }, 'dex', 8, 4)).toEqual({
      current: 3,
      max: 3,
    });
    expect(gritAfterMaximumChange({ current: 0, max: 5 }, 'wil', 6, 8)).toEqual({
      current: 0,
      max: 6,
    });
  });

  it('leaves STR edits and unchanged maxima alone', () => {
    const grit = { current: 2, max: 8 };
    expect(gritAfterMaximumChange(grit, 'str', 4, 8)).toBe(grit);
    expect(gritAfterMaximumChange(grit, 'wil', 6, 6)).toBe(grit);
  });
});
