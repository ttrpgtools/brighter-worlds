import type { DieValue } from "$lib/types";

export function getModifiedDice(ev: MouseEvent, value: DieValue) {
  if (ev.altKey) return getImpaired();
  if (ev.shiftKey) return getEnhanced(value);
  return [value];
}

export function getEnhanced(value: DieValue): DieValue[] {
  return [value, 12];
}

export function getImpaired(): DieValue[] {
  return [4];
}
