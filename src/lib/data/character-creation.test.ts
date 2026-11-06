import { describe, expect, it } from 'vitest';
import { callingManager } from './calling-manager';
import { spellManager, ritualManager } from './magic-manager';
import { enhancementManager } from './table-manager';
import {
  beginCalling,
  applyCreationSelections,
  buildCompanion,
  improveItem,
  resolveCreationEquipment,
  validStartingAttributes,
  validateStartingMagic,
  type CreationSelection,
  type CreationDraft,
} from './character-creation';
import type { Attrs } from '$lib/types';
import type { StartingGearPair } from './starting-equipment';

function draft(key: string): CreationDraft {
  return {
    ...beginCalling(
      callingManager.getById(`calling-${key}`)!,
      spellManager.getAll(),
      ritualManager.getAll(),
      () => 1,
    ),
    str: { current: 8, max: 8 },
    dex: { current: 6, max: 6 },
    wil: { current: 4, max: 4 },
    grit: { current: 2, max: 2 },
    name: 'Adventurer',
  };
}
function selection(
  table: string,
  name: string,
  extra: Partial<CreationSelection> = {},
): CreationSelection {
  const t = enhancementManager.getById(table)!;
  return { ...t.options.find((o) => o.name === name)!, table, type: t.type, ...extra };
}
const gear: StartingGearPair[] = [
  ['Haunted', { id: 'whip', name: 'Whip', damage: 6 }],
  ['Flexible', { id: 'bucket', name: 'Bucket' }],
  ['Floating', { id: 'hat', name: 'Hat' }],
];

describe('creation validation and catalogue isolation', () => {
  it.each([
    { str: 8, dex: 6, wil: 4 },
    { str: 4, dex: 8, wil: 6 },
    { str: 6, dex: 4, wil: 8 },
  ])('accepts a complete Attribute assignment %j', (attrs) => {
    expect(validStartingAttributes(attrs as Attrs)).toBe(true);
  });
  it.each([
    { str: 4, dex: 4, wil: 4 },
    { str: 8, dex: 8, wil: 6 },
    { str: 10, dex: 6, wil: 4 },
  ])('rejects an incomplete or illegal assignment %j', (attrs) => {
    expect(validStartingAttributes(attrs as Attrs)).toBe(false);
  });
  it('makes owned copies of equipment, core abilities and starting magic', () => {
    const c = callingManager.getById('calling-demonic-sorcerer')!;
    const first = draft('demonic-sorcerer');
    first.abilities![0].desc = 'Custom';
    first.spells![0].desc = 'Custom';
    const second = draft('demonic-sorcerer');
    expect(second.abilities![0].desc).toBe(c.abilities[0].desc);
    expect(second.spells![0].desc).not.toBe('Custom');
    const a = draft('grimblade');
    const b = draft('grimblade');
    expect(a.equipment![0].id).not.toBe(b.equipment![0].id);
    a.equipment![0].name = 'Custom';
    expect(callingManager.getById('calling-grimblade')!.equipment[0].name).toBe('Grimblade');
  });
  it('rejects missing gear rolls including sparse arrays', () => {
    expect(() => resolveCreationEquipment([], draft('alchemist'))).toThrow(/every/);
    const sparse = [...gear];
    delete sparse[1];
    expect(() => resolveCreationEquipment(sparse, draft('alchemist'))).toThrow(/every/);
    expect(resolveCreationEquipment(gear, draft('alchemist')).map((i) => i.name)).toEqual([
      'Coins',
      'Haunted Whip',
      'Flexible Bucket',
      'Floating Hat',
    ]);
  });
  it('requires the exact number of different, unowned magic choices', () => {
    const d = draft('witch');
    const spells = spellManager.getAll();
    expect(() => validateStartingMagic(d.choices!, [], spells, [], 'spell')).toThrow(/Choose 2/);
    expect(() =>
      validateStartingMagic(d.choices!, [spells[0], spells[0]], spells, [], 'spell'),
    ).toThrow();
    expect(() =>
      validateStartingMagic(d.choices!, spells.slice(0, 2), spells, [spells[0]], 'spell'),
    ).toThrow();
    expect(() =>
      validateStartingMagic(d.choices!, spells.slice(0, 2), spells, [], 'spell'),
    ).not.toThrow();
  });
});

describe('companion and form Perks', () => {
  it('applies Familiar Attributes, derived Grit, natural attack and Armor', () => {
    const c = buildCompanion(
      callingManager.getById('calling-witch-familiar')!,
      'Pip',
      ['Big', 'Fast', 'Flying'],
      true,
    );
    expect(c).toMatchObject({
      str: { current: 6, max: 6 },
      dex: { current: 6, max: 6 },
      wil: { current: 4, max: 4 },
      grit: { current: 2, max: 2 },
    });
    expect(c.equipment!.find((i) => i.name === 'Attack')!.damage).toBe(6);
    expect(c.equipment!.find((i) => i.name === 'Natural Armor')!.armor).toBe(1);
    expect(c.abilities!.some((a) => a.type === 'advanced')).toBe(false);
  });
  it('combines explicit Grit bonuses with DEX/WIL increases', () => {
    const c = buildCompanion(callingManager.getById('calling-animal')!, 'Nim', [
      'Fast',
      'Clever',
      'Tiny',
    ]);
    expect(c.grit!.max).toBe(7);
    expect(c.dex!.max).toBe(8);
    expect(c.wil!.max).toBe(8);
  });
  it('stacks attack steps and preserves freeform Vicious effects', () => {
    const c = buildCompanion(callingManager.getById('calling-animal')!, 'Bear', [
      'Big',
      'Vicious',
      'Durable',
    ]);
    expect(c.equipment!.find((i) => i.name === 'Attack')).toMatchObject({
      damage: 10,
      desc: expect.stringContaining('Vicious'),
    });
    expect(c.equipment!.find((i) => i.name === 'Natural Armor')!.armor).toBe(2);
  });
  it('blocks missing/duplicate Perks, missing names and flight without Flying', () => {
    const c = callingManager.getById('calling-animal')!;
    expect(() => buildCompanion(c, '', ['Big', 'Fast', 'Flying'])).toThrow(/name/);
    expect(() => buildCompanion(c, 'Bird', ['Big', 'Big', 'Flying'])).toThrow(/different/);
    expect(() => buildCompanion(c, 'Bird', ['Big', 'Fast', 'Clever'], true)).toThrow(/Flying/);
  });
  it('records a Great Soul form without applying its Perks to the human body', () => {
    const d = draft('soulbearer');
    const choices = ['Big', 'Fast', 'Clever'].map((n) => selection('rt-animal-companion', n));
    expect(() => applyCreationSelections(d, choices)).toThrow(/creature/);
    const result = applyCreationSelections(d, choices, 'Fox');
    expect(result.str).toEqual(d.str);
    expect(result.dex).toEqual(d.dex);
    expect(result.grit).toEqual(d.grit);
    const form = result.abilities!.find((a) => a.details === 'Great Soul form')!;
    expect(form.desc).toContain('STR d10, DEX d8, WIL d6, Max Grit 4');
    expect(form.desc).toContain('transforming does not heal');
    expect(result.abilities!.filter((a) => a.details === 'form perk')).toHaveLength(3);
  });
});

describe('item Improvements and Calling-specific choices', () => {
  it('distributes the Tool Improvement plus three additional Improvements', () => {
    const d = draft('artificer');
    const [weapon, armor, tool] = d.equipment!;
    const choices = [
      selection('rt-artifice-improvements', 'Special', {
        target: tool.id,
        note: 'A clockwork key',
      }),
      selection('rt-artifice-improvements', 'Deadly', { target: weapon.id }),
      selection('rt-artifice-improvements', 'Deadly', { target: weapon.id }),
      selection('rt-artifice-improvements', 'Extra Protection', { target: armor.id }),
    ];
    const result = applyCreationSelections(d, choices);
    expect(result.equipment!.find((i) => i.id === weapon.id)!.damage).toBe(10);
    expect(result.equipment!.find((i) => i.id === armor.id)).toMatchObject({
      armor: 2,
      bulky: true,
    });
    expect(result.equipment!.find((i) => i.id === tool.id)!.desc).toContain('A clockwork key');
    expect(d.equipment![0].damage).toBe(6);
    choices[0].target = weapon.id;
    expect(() => applyCreationSelections(d, choices)).toThrow(/Masterwork Tool/);
  });
  it('applies Grimblade Light while retaining its starting magic capability', () => {
    const d = draft('grimblade');
    const result = applyCreationSelections(d, [
      selection('rt-artifice-improvements', 'Light', { target: d.equipment![0].id }),
    ]);
    expect(result.equipment![0]).toMatchObject({
      bulky: false,
      damage: 10,
      enableMagic: { type: 'spells' },
    });
    expect(result.choices!.filter((c) => c.choose === 'magic')).toHaveLength(2);
  });
  it('keeps conditional bonuses descriptive and makes Light independent of slot order', () => {
    const item = { id: 'weapon', name: 'Weapon', damage: 6 as const };
    const choices = [
      selection('rt-artifice-improvements', 'Light'),
      selection('rt-artifice-improvements', 'Heavy'),
      selection('rt-artifice-improvements', 'Ward', { note: 'Against fire' }),
    ];
    expect(improveItem(item, choices)).toMatchObject({
      bulky: false,
      damage: 8,
      desc: expect.stringContaining('Against fire'),
    });
    expect(improveItem(item, choices).armor).toBeUndefined();
    expect(improveItem(item, [selection('rt-artifice-improvements', 'Paired')]).quantity).toBe(2);
  });
  it('requires all choice groups and preserves linked companion requirements', () => {
    const d = draft('runewright');
    expect(() => applyCreationSelections(d, [])).toThrow(/every/);
    const options = [
      ['rt-ruins-elements', 'Air'],
      ['rt-ruins-elements', 'Water'],
      ['rt-ruins-verbs', 'Move'],
      ['rt-ruins-verbs', 'Enhance'],
      ['rt-ruins-subjects', 'Creature'],
      ['rt-ruins-subjects', 'Object'],
    ].map(([t, n]) => selection(t, n));
    const linked = { choose: 'linked' as const, id: 'calling-animal', name: 'Animal' };
    const result = applyCreationSelections(
      {
        ...d,
        choices: [
          ...d.choices!,
          linked,
          { choose: 'enhancement', table: 'rt-animal-companion', linked: true },
        ],
      },
      options,
    );
    expect(result.choices).toEqual([
      linked,
      { choose: 'enhancement', table: 'rt-animal-companion', linked: true },
    ]);
  });
  it('records Weapon of Faith, respects Poverty, and applies Thermo Regulation', () => {
    const d = draft('devoted');
    const choices = [
      selection('rt-devoted-vows', 'Poverty'),
      selection('rt-devoted-boons', 'Weapon of Faith'),
      selection('rt-devoted-boons', 'By Will Sustained'),
    ];
    expect(() => applyCreationSelections(d, choices)).toThrow(/Weapon of Faith/);
    choices[1].grant = 'Deadly';
    const result = applyCreationSelections(d, choices);
    expect(result.abilities!.find((a) => a.name === 'Weapon of Faith')!.desc).toContain(
      'ignore Armor',
    );
    expect(resolveCreationEquipment(gear, result).some((i) => i.name === 'Coins')).toBe(false);
    const water = applyCreationSelections(draft('blessed-water'), [
      selection('rt-water-blessing', 'Thermo Regulation'),
    ]);
    expect(water.equipment!.find((i) => i.name === 'Water')!.damage).toBe(8);
  });
});
