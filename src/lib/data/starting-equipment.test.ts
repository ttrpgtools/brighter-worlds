import { expect, it, vi } from 'vitest';
import { combineStartingGear } from './starting-equipment';
import { spellManager, ritualManager } from './magic-manager';
import { encodeSheet, ExportContext } from './sheet-format/codec';
import { newCharacter } from './account-creation';
it.each([
  ['Random Spell Scroll', 'spell', spellManager],
  ['Random Ritual Scroll', 'ritual', ritualManager],
] as const)(
  'turns %s into an owned, editable item with a complete random magic definition',
  async (name, type, manager) => {
    const catalogue = manager.getAll();
    const random = vi.fn(() => catalogue.length);
    const original = { id: 'table-item', name, bulky: false };
    const item = combineStartingGear(['Stolen', original], random)!;
    const selected = catalogue.at(-1)!;
    expect(random).toHaveBeenCalledExactlyOnceWith(catalogue.length);
    expect(item.name).toContain(selected.name);
    expect(item.name).not.toContain('Random');
    expect(item.desc).toContain(selected.desc);
    expect(item.magic?.[type]).toEqual(selected);
    expect(original.name).toBe(name);
    expect(item.id).not.toBe(original.id);
    const character = newCharacter(
      { calling: { id: 'calling', name: 'Calling' }, equipment: [item] },
      'test-scroll',
    );
    const { document } = await encodeSheet(character, new ExportContext(null));
    expect(document.character.equipment[0].magic?.[type]).toEqual(selected);
    const attached = item.magic![type]!;
    if (Array.isArray(attached)) throw new Error('Expected one assigned magic entry');
    attached.name = 'My edited magic';
    expect(catalogue.at(-1)!.name).toBe(selected.name);
  },
);
it('resolves the Mystic weapon flair while retaining weapon properties and choosing independent scroll snapshots', () => {
  const base = {
    id: 'sword',
    name: 'Sword',
    damage: 8 as const,
    bulky: true,
    desc: 'An heirloom.',
  };
  const first = combineStartingGear(['Mystic (is a random spell scroll)', base], () => 1)!;
  const second = combineStartingGear(['Mystic (is a random spell scroll)', base], () => 1)!;
  expect(first.name).toBe(`Mystic Sword (${spellManager.getAll()[0].name})`);
  expect(first).toMatchObject({ damage: 8, bulky: true });
  expect(first.desc).toContain('An heirloom.');
  expect(first.magic?.spell).toEqual(spellManager.getAll()[0]);
  expect(first.id).not.toBe(second.id);
  expect(first.magic?.spell).not.toBe(second.magic?.spell);
});
it('preserves ordinary flair merging and incomplete/unrolled equipment without drawing magic', () => {
  const random = vi.fn();
  expect(combineStartingGear(undefined, random)).toBeUndefined();
  expect(combineStartingGear(['Floating', undefined], random)).toBeUndefined();
  expect(
    combineStartingGear(
      [
        { id: 'flair', name: 'Weaponized', damage: 6, desc: 'Flair text.' },
        { id: 'bucket', name: 'Bucket', desc: 'Item text.' },
      ],
      random,
    ),
  ).toEqual({ id: 'bucket', name: 'Weaponized Bucket', damage: 6, desc: 'Flair text. Item text.' });
  expect(random).not.toHaveBeenCalled();
});
