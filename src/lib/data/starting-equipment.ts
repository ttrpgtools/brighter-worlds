import type { Item } from '$lib/types';
import { spellManager, ritualManager } from './magic-manager';
import { roll } from '$lib/rolling/roll';
import { id } from '$lib/rolling/id';
export type StartingGearPair = [string | Item | undefined, Item | undefined];
const MYSTIC = 'Mystic (is a random spell scroll)';

/** Resolve once on Next, so previews, swaps and rerenders do not reroll the magic. */
export function combineStartingGear(
  pair: StartingGearPair | undefined,
  random: (sides: number) => number = roll,
): Item | undefined {
  if (!pair?.[0] || !pair[1]) return;
  const [flair, base] = pair;
  const description = [typeof flair === 'string' ? undefined : flair.desc, base.desc]
    .filter(Boolean)
    .join(' ');
  const item: Item = {
    ...(typeof flair === 'string' ? {} : flair),
    ...base,
    name: `${typeof flair === 'string' ? flair : flair.name} ${base.name}`,
  };
  if (description) item.desc = description;
  const type =
    base.name === 'Random Ritual Scroll'
      ? 'ritual'
      : base.name === 'Random Spell Scroll' || flair === MYSTIC
        ? 'spell'
        : undefined;
  if (!type) return item;
  const catalogue = type === 'spell' ? spellManager.getAll() : ritualManager.getAll();
  const selected = structuredClone(catalogue[random(catalogue.length) - 1]);
  const prefix = typeof flair === 'string' ? (flair === MYSTIC ? 'Mystic' : flair) : flair.name;
  const kind =
    base.name === 'Random Spell Scroll'
      ? 'Spell Scroll'
      : base.name === 'Random Ritual Scroll'
        ? 'Ritual Scroll'
        : base.name;
  item.id = id();
  item.name = `${prefix} ${kind} (${selected.name})`;
  item.desc = [description, selected.desc].filter(Boolean).join(' ');
  item.magic = { ...item.magic, [type]: selected };
  return item;
}
