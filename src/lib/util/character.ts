import { status } from '$lib/const';
import { stepDown } from '$lib/dice';
import type { Ability, DieValue, EulogyStanza, Item, MagicCapacity, MagicType } from '$lib/types';

export function capArmor(value: number) {
  return Number.isFinite(value) ? Math.min(3, Math.max(0, value)) : 0;
}

export function armor(eq: Item[], base = 0) {
  return capArmor(
    eq.reduce(
      (total, item) =>
        total + (!item.unequiped && (item.quantity ?? 1) > 0 ? (item.armor ?? 0) : 0),
      base,
    ),
  );
}

export function burdened(eq: Item[], abilities: Ability[] = []) {
  const limit = abilities.some(
    (ability) =>
      ability.id === 'ability-ROkZpg6bJKwjCWnc1' ||
      (ability.type === 'advanced' && ability.name === 'Mule'),
  )
    ? 4
    : 2;
  return (
    eq.reduce((total, item) => total + (item.bulky ? Math.max(0, item.quantity ?? 1) : 0), 0) >
    limit
  );
}

/** Shared by Wounds and other Attribute loss, including failed spellcasting. */
export function loseAttributeStep(die: DieValue | 0, statuses: Set<string>) {
  const next = die === 0 ? 0 : stepDown(die);
  const outcome = die === 0 ? status.DEAD : next === 0 ? status.INCAPACITATED : undefined;
  const updated = new Set(outcome ? [outcome, ...statuses] : statuses);
  if (outcome === status.DEAD) updated.delete(status.INCAPACITATED);
  return { die: next, statuses: updated };
}

export function xp(es: EulogyStanza[]) {
  return es.reduce((p, c) => p + (c.xp && !c.spent ? 1 : 0), 0);
}

export function isFunctional(statuses: Set<string>) {
  return (
    !statuses.has(status.DEAD) &&
    !statuses.has(status.CATATONIC) &&
    !statuses.has(status.INCAPACITATED) &&
    !statuses.has(status.UNCONSCIOUS) &&
    !statuses.has(status.PARALYSED)
  );
}

export function getMagic(items: Item[], type: MagicType): (MagicCapacity & { name: string })[] {
  const magicItems = items
    .filter((item) => item.magic && item.magic[type])
    .map((item) => ({ name: item.name, ...item.magic }));
  return magicItems;
}
