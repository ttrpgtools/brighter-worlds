import { get } from 'svelte/store';
import type { AsyncWritable } from './async-load-store';
import { normalizeLegacyItem } from './legacy-sheet';
import { isEmpty, type Character, type Item } from '$lib/types';
import { decode } from '$lib/util/b64';
import { id } from '$lib/rolling/id';

export function readSharedItem(encoded: string): Item {
  if (encoded.length > 65536) throw new Error('This item link is too large.');
  const item = normalizeLegacyItem(JSON.parse(decode(encoded)));
  if (!item.name.trim() || (item.quantity !== undefined && item.quantity < 1)) {
    throw new Error('This item link has an invalid name or quantity.');
  }
  return item;
}

/** A receipt is shown only after the selected sheet has loaded and its save succeeds. */
export async function receiveItem(sheet: AsyncWritable<Character>, item: Item) {
  await sheet.loaded;
  if (isEmpty(get(sheet))) throw new Error('The selected character could not be loaded.');
  await sheet.update((character) => {
    const equipment = character.equipment;
    const existing = equipment.find((entry) => entry.name === item.name);
    const received = structuredClone(item);
    if (equipment.some((entry) => entry.id === received.id)) received.id = id();
    return {
      ...character,
      equipment: existing
        ? equipment.map((entry) =>
            entry === existing
              ? { ...entry, quantity: (entry.quantity ?? 1) + (item.quantity ?? 1) }
              : entry,
          )
        : [...equipment, received],
    };
  });
}
