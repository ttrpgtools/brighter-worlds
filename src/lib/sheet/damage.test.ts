import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Attr, DamageDetails, DamageForm } from '$lib/types';
import { bestRoll } from '$lib/rolling/roll';
import { calculateDamage, parseDamage } from './damage';

vi.mock('$lib/rolling/roll', () => ({ bestRoll: vi.fn() }));
const roll = vi.mocked(bestRoll);
const character = (overrides: Partial<DamageDetails> = {}): DamageDetails => ({
  armor: 0,
  grit: 0,
  dice: { str: 6, dex: 6, wil: 6 },
  statuses: new Set(),
  ...overrides,
});
const hit = (damage: string, overrides: Partial<DamageForm> = {}): DamageForm => ({
  damage,
  type: 'str',
  bypassGrit: false,
  bypassArmor: false,
  overflow: true,
  ...overrides,
});

beforeEach(() => {
  roll.mockReset();
  roll.mockImplementation((dice) => Math.max(...dice));
});

describe('independent attacks and Direct Damage Saves', () => {
  it('saves separately against two attacks that would cause a Wound if summed', () => {
    const result = calculateDamage(character(), hit('4 4'))!;
    expect(result.die).toBeUndefined();
    expect(result.saves.map((save) => [save.dd, save.save])).toEqual([
      [4, 6],
      [4, 6],
    ]);
    expect(result.msg).toContain('Attack 2:');
  });

  it('subtracts Armor per attack and consumes the remaining Grit in order', () => {
    const result = calculateDamage(character({ armor: 1, grit: 5 }), hit('4 4'))!;
    expect(result.grit).toBe(0);
    expect(result.saves).toEqual([{ dice: [6], dd: 1, save: 6 }]);
    expect(result.die).toBeUndefined();
  });

  it('uses the reduced Attribute on the next attack', () => {
    roll.mockReturnValueOnce(2);
    const result = calculateDamage(character(), hit('3 4'))!;
    expect(result.die).toBe(0);
    expect(result.statuses).toContain('incapacitated');
    expect(result.saves).toHaveLength(1);
  });

  it('a tie on a Direct Damage Save causes a Wound', () => {
    roll.mockReturnValue(3);
    expect(calculateDamage(character(), hit('3'))?.die).toBe(4);
  });

  it.each([
    ['enhance', [6, 12]],
    ['impair', [4]],
  ] as const)('applies the %s modifier to each save', (mod, expected) => {
    calculateDamage(character({ mod }), hit('2 2'));
    expect(roll.mock.calls.map(([dice]) => Array.from(dice))).toEqual([expected, expected]);
  });

  it('caps effective Armor even when a caller supplies a larger value', () => {
    const result = calculateDamage(character({ armor: 10 }), hit('4'))!;
    expect(result.saves[0].dd).toBe(1);
  });

  it('keeps Bypass Grit as Direct Damage, separate from an immediate Wound', () => {
    const result = calculateDamage(character({ grit: 9 }), hit('1', { bypassGrit: true }))!;
    expect(result.grit).toBeUndefined();
    expect(result.die).toBeUndefined();
    expect(result.saves).toHaveLength(1);
  });

  it('supports bypassing Armor without changing the stored Armor', () => {
    expect(calculateDamage(character({ armor: 3 }), hit('2'))?.saves).toEqual([]);
    expect(
      calculateDamage(character({ armor: 3 }), hit('2', { bypassArmor: true }))?.saves[0].dd,
    ).toBe(2);
  });
});

describe('overflow and zero Attributes', () => {
  it('an exact maximum causes one automatic Wound without a save', () => {
    expect(calculateDamage(character(), hit('6'))?.die).toBe(4);
    expect(roll).not.toHaveBeenCalled();
  });

  it('saves against the overflow on the newly reduced Attribute', () => {
    const result = calculateDamage(character({ dice: { str: 8, dex: 6, wil: 6 } }), hit('10'))!;
    expect(result.die).toBe(6);
    expect(result.saves).toEqual([{ dice: [6], save: 6, dd: 2 }]);
  });

  it('reaching exactly zero incapacitates, while further overflow kills', () => {
    expect(calculateDamage(character(), hit('10'))?.statuses).toEqual(new Set(['incapacitated']));
    expect(calculateDamage(character(), hit('11'))?.statuses).toEqual(new Set(['dead']));
  });

  it.each(['str', 'dex', 'wil'] as Attr[])(
    'further damage at zero %s kills and preserves unrelated statuses',
    (type) => {
      const c = character({ statuses: new Set(['poisoned', 'incapacitated']) });
      c.dice[type] = 0;
      const result = calculateDamage(c, hit('1', { type }))!;
      expect(result.statuses).toEqual(new Set(['dead', 'poisoned']));
      expect([...result.statuses!][0]).toBe('dead'); // NPCs store their primary status.
      expect(roll).not.toHaveBeenCalled();
    },
  );

  it('another attack can kill an Attribute reduced to zero by the preceding attack', () => {
    const result = calculateDamage(character({ dice: { str: 4, dex: 6, wil: 6 } }), hit('4 1'))!;
    expect(result.statuses).toEqual(new Set(['dead']));
  });

  it('Grit still protects a zero Attribute until actual Direct Damage occurs', () => {
    const result = calculateDamage(
      character({ grit: 2, dice: { str: 0, dex: 6, wil: 6 } }),
      hit('1'),
    )!;
    expect(result.grit).toBe(1);
    expect(result.statuses).toBeUndefined();
    expect(result.msg).not.toContain('incapacitated');
  });

  it('can disable overflow for abilities which prevent it', () => {
    const result = calculateDamage(character(), hit('100', { overflow: false }))!;
    expect(result.die).toBe(4);
    expect(result.statuses).toBeUndefined();
    expect(roll).not.toHaveBeenCalled();
  });

  it('honors the fixed Attribute of a character-sheet damage action', () => {
    const result = calculateDamage(
      character({ type: 'dex', dice: { str: 8, dex: 4, wil: 6 } }),
      hit('4'),
    )!;
    expect(result.type).toBe('dex');
    expect(result.die).toBe(0);
  });
});

describe('out-of-combat Wounds and input handling', () => {
  it('a Wound bypasses Armor, Grit and saves without a numeric damage amount', () => {
    const result = calculateDamage(character({ armor: 3, grit: 9 }), hit('', { wound: true }))!;
    expect(result.die).toBe(4);
    expect(result.grit).toBeUndefined();
    expect(result.saves).toEqual([]);
    expect(roll).not.toHaveBeenCalled();
  });

  it.each(['str', 'dex', 'wil'] as Attr[])('a direct Wound at zero %s kills', (type) => {
    const c = character();
    c.dice[type] = 0;
    expect(calculateDamage(c, hit('', { type, wound: true }))?.statuses).toContain('dead');
  });

  it('uses Wound terminology and does not mutate the input sheet', () => {
    const c = character();
    const before = structuredClone(c);
    const result = calculateDamage(c, hit('11'))!;
    expect(c).toEqual(before);
    expect(result.msg).not.toMatch(/critical/i);
  });

  it('accepts the existing separators', () => {
    expect(parseDamage(' 1 2,3#4*5 ')).toEqual([1, 2, 3, 4, 5]);
  });

  it.each(['', '-4', '2oops', '1.5', 'Infinity', '9007199254740992', '0'])(
    'rejects invalid or empty damage %j without rolling',
    (input) => {
      expect(calculateDamage(character(), hit(input))).toBeUndefined();
      expect(roll).not.toHaveBeenCalled();
    },
  );

  it('cancellation changes nothing', () => {
    expect(calculateDamage(character(), undefined)).toBeUndefined();
    expect(roll).not.toHaveBeenCalled();
  });
});
