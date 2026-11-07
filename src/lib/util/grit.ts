import type { Attr, Attribute, DieValue } from '$lib/types';

export function calculateGrit(dex: DieValue, wil: DieValue) {
  return 1 + Math.floor((dex - 4) / 2) + Math.floor((wil - 4) / 2);
}

/** Apply only an explicit maximum edit, preserving existing custom Grit bonuses. */
export function gritAfterMaximumChange(
  grit: Attribute,
  attr: Attr,
  previous: DieValue,
  next: DieValue,
): Attribute {
  if (attr === 'str' || previous === next) return grit;
  const max = Math.max(0, grit.max + (next - previous) / 2);
  return { max, current: Math.min(grit.current, max) };
}
