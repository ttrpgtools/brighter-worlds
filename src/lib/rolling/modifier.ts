import type { DieMod, DieRollSet, DieValue } from "$lib/types";

function flat(value: DieValue | DieValue[]): DieRollSet {
  return Array.isArray(value) ? value : [value];
}

export function getModifiedDice(ev: MouseEvent, value: DieValue | DieValue[]) {
  if (ev.ctrlKey || ev.metaKey) return flat(value);
  if (ev.altKey) return getImpaired();
  if (ev.shiftKey) return getEnhanced(value);
  return flat(value);
}

export function getModDiceSet(value: DieValue | DieValue[], mod?: DieMod) {
  if (mod === 'enhance') return getEnhanced(value);
  if (mod === 'impair') return getImpaired();
  return flat(value);
}

export function getEnhanced(value: DieValue | DieValue[]): DieRollSet {
  const drs = [...(flat(value)), 12] as DieRollSet;
  drs.mod = 'enhance';
  return drs;
}

export function getImpaired(): DieRollSet {
  const drs = [4] as DieRollSet;
  drs.mod = 'impair';
  return drs;
}
