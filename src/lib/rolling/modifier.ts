import type { DieValue } from "$lib/types";

function flat(value: DieValue | DieValue[]) {
  return Array.isArray(value) ? value : [value];
}

export function getModifiedDice(ev: MouseEvent, value: DieValue | DieValue[]) {
  if (ev.ctrlKey || ev.metaKey) return flat(value);
  if (ev.altKey) return getImpaired();
  if (ev.shiftKey) return getEnhanced(value);
  return flat(value);
}

export function getEnhanced(value: DieValue | DieValue[]): DieValue[] {
  return [...(flat(value)), 12];
}

export function getImpaired(): DieValue[] {
  return [4];
}
