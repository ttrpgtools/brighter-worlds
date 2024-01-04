import { status } from "$lib/const";
import type { EulogyStanza, Item } from "$lib/types";

export function armor(eq: Item[]) {
  return eq ? eq.reduce((p, c) => p + (c.armor ? c.armor : 0), 0) : 0;
}

export function burdened(eq: Item[]) {
  let bulky = 0;
  for (let index = 0; index < eq.length; index++) {
    const item = eq[index];
    if (item.bulky) {
      bulky++;
      if (bulky > 2) return true;
    }
  }
  return false;
}

export function xp(es: EulogyStanza[]) {
  return es.reduce((p, c) => p + (c.xp && !c.spent ? 1 : 0), 0);
}

export function isFunctional(statuses: Set<string>) {
  return !statuses.has(status.DEAD)
      && !statuses.has(status.CATATONIC)
      && !statuses.has(status.INCAPACITATED)
      && !statuses.has(status.UNCONSCIOUS)
      && !statuses.has(status.PARALYSED);
}
