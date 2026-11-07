import { describe, expect, it } from 'vitest';
import type { Ability, Item } from '$lib/types';
import { armor, burdened, loseAttributeStep } from './character';

const item = (overrides: Partial<Item> = {}): Item => ({ id: 'item', name: 'Item', ...overrides });
const mule: Ability = { id: 'ability-ROkZpg6bJKwjCWnc1', name: 'Mule', type: 'advanced' };

describe('effective armor', () => {
  it('caps combined item and NPC base Armor at three', () => {
    expect(armor([item({ armor: 2 }), item({ armor: 2 })])).toBe(3);
    expect(armor([item({ armor: 1 })], 3)).toBe(3);
    expect(armor([], 7)).toBe(3);
  });

  it('ignores inactive and zero-quantity armor', () => {
    expect(
      armor([
        item({ armor: 1 }),
        item({ armor: 2, unequiped: true }),
        item({ armor: 2, quantity: 0 }),
      ]),
    ).toBe(1);
  });

  it('a depleted resource does not disable Armor unless the item is inactive', () => {
    expect(armor([item({ armor: 2, depleted: true })])).toBe(2);
  });

  it('does not require new fields on existing items or rewrite their data', () => {
    const oldItems = [item({ armor: 2 })];
    const before = structuredClone(oldItems);
    expect(armor(oldItems)).toBe(2);
    expect(oldItems).toEqual(before);
  });
});

describe('burden', () => {
  it('counts quantities, with an omitted quantity meaning one', () => {
    expect(burdened([item({ bulky: true, quantity: 2 })])).toBe(false);
    expect(burdened([item({ bulky: true, quantity: 2 }), item({ bulky: true })])).toBe(true);
    expect(burdened([item({ bulky: true, quantity: 0 })])).toBe(false);
  });

  it('Mule allows four bulky items, including for a renamed saved ability', () => {
    expect(
      burdened([item({ bulky: true, quantity: 4 })], [{ ...mule, name: 'My custom Mule name' }]),
    ).toBe(false);
    expect(burdened([item({ bulky: true, quantity: 5 })], [mule])).toBe(true);
  });

  it('recognizes a manually added advanced Mule ability', () => {
    expect(burdened([item({ bulky: true, quantity: 3 })], [{ ...mule, id: 'custom' }])).toBe(false);
  });

  it('inactive armor is still carried and depleted bulky containers still count', () => {
    expect(
      burdened([
        item({ bulky: true, unequiped: true }),
        item({ bulky: true, depleted: true }),
        item({ bulky: true }),
      ]),
    ).toBe(true);
  });
});

describe('Attribute loss, including failed casting', () => {
  it('zero WIL means incapacitation instead of catatonia', () => {
    const statuses = new Set(['deprived']);
    expect(loseAttributeStep(4, statuses)).toEqual({
      die: 0,
      statuses: new Set(['incapacitated', 'deprived']),
    });
    expect(statuses).toEqual(new Set(['deprived']));
  });

  it('stepping down a nonzero die preserves unrelated statuses', () => {
    expect(loseAttributeStep(8, new Set(['poisoned']))).toEqual({
      die: 6,
      statuses: new Set(['poisoned']),
    });
  });
});
