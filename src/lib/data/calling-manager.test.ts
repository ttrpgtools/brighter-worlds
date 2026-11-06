import { describe, expect, it } from 'vitest';
import { callingManager } from './calling-manager';
import { enhancementManager } from './table-manager';
import type { Calling } from '$lib/types';

const calling = (id: string) => callingManager.getById(`calling-${id}`)!;
const allCallings = () => [...callingManager.getAll(), ...callingManager.getHidden()];
const core = (c: Calling) => c.abilities.find((a) => a.type === 'core')!;
const enhancements = (c: Calling, table: string) =>
  (c.choices ?? []).filter((choice) => choice.choose === 'enhancement' && choice.table === table);

describe('current Calling catalogue and creation definitions', () => {
  it('keeps all published Callings and a complete core/advanced ability structure', () => {
    expect(callingManager.getAll()).toHaveLength(15);
    for (const c of callingManager.getAll()) {
      expect(
        c.abilities.filter((a) => a.type === 'core'),
        c.name,
      ).toHaveLength(1);
      expect(
        c.abilities.filter((a) => a.type === 'advanced'),
        c.name,
      ).toHaveLength(4);
    }
    expect(
      callingManager
        .getHidden()
        .map((c) => c.id)
        .sort(),
    ).toEqual(['calling-animal', 'calling-witch-familiar']);
  });

  it('resolves every table, linked companion and ability choice without duplicate identities', () => {
    const ids = allCallings().flatMap((c) => [c.id, ...c.abilities.map((a) => a.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of allCallings()) {
      for (const choice of [...(c.choices ?? []), ...c.abilities.flatMap((a) => a.choices ?? [])]) {
        if (choice.choose === 'enhancement')
          expect(
            enhancementManager.getById(choice.table),
            `${c.name}: ${choice.table}`,
          ).toBeDefined();
        if (choice.choose === 'linked')
          expect(callingManager.getById(choice.id), c.name).toBeDefined();
      }
    }
    const tables = enhancementManager.getAll();
    expect(new Set(tables.map((t) => t.id)).size).toBe(tables.length);
    for (const table of tables)
      expect(new Set(table.options.map((o) => o.name)).size, table.name).toBe(table.options.length);
  });

  it('puts Psychopomp in the core and gives Manifestation its own unlock identity', () => {
    const c = calling('soulbearer');
    expect(core(c)).toMatchObject({ id: 'ability-Cz3QXo', name: 'Psychopomp' });
    const advanced = c.abilities.filter((a) => a.type === 'advanced');
    expect(advanced.some((a) => a.name === 'Psychopomp')).toBe(false);
    expect(advanced.find((a) => a.name === 'Manifestation')?.id).not.toBe('ability-IZpjC5D6bZdc');
    expect(advanced.find((a) => a.name === 'Manifestation')).toBeDefined();
    expect(c.equipment.map((e) => e.name)).toEqual(['Your Great Soul']);
  });

  it('does not give Archivists or Alchemists removed starting rituals or extra gear rolls', () => {
    for (const id of ['archivist', 'alchemist']) {
      const c = calling(id);
      expect(c.rituals ?? []).toEqual([]);
      expect(c.choices ?? []).toEqual([]);
    }
    expect(calling('archivist').equipment).toHaveLength(1);
    expect(calling('archivist').equipment[0].desc).toContain('two Topics');
    expect(calling('alchemist').equipment.filter((e) => e.quantity === 3)).toHaveLength(2);
  });

  it('gives a Witch familiar three Perks and a Crystal Wizard two individually editable crystals', () => {
    expect(enhancements(calling('witch-familiar'), 'rt-animal-companion')).toHaveLength(3);
    expect(enhancements(calling('animal'), 'rt-animal-companion')).toHaveLength(3);
    expect(calling('witch-familiar')).toMatchObject({ grit: 1, attrs: { str: 4, dex: 4, wil: 4 } });
    const crystals = calling('crystal-wizard').equipment.filter(
      (e) => e.name === 'Arcane Storage Crystal',
    );
    expect(crystals).toHaveLength(2);
    expect(new Set(crystals.map((e) => e.id)).size).toBe(2);
    expect(crystals[0].desc).not.toBe(crystals[1].desc);
  });

  it('defines the starting Improvements and magic without legacy bonus grants', () => {
    const artificer = calling('artificer');
    expect(enhancements(artificer, 'rt-artifice-improvements')).toHaveLength(4);
    expect(artificer.equipment).toHaveLength(3);
    expect(artificer.equipment.find((e) => e.name === 'Masterwork Weapon')?.damage).toBe(6);
    expect(enhancements(calling('grimblade'), 'rt-artifice-improvements')).toHaveLength(1);
    expect(
      calling('grimblade').choices?.filter((c) => c.choose === 'magic' && c.type === 'spell'),
    ).toHaveLength(2);
    expect(calling('demonic-sorcerer').spells).toEqual(['?']);
    expect(calling('demonic-sorcerer').rituals).toEqual(['?']);
    expect(calling('demonic-sorcerer').choices?.filter((c) => c.choose === 'magic')).toHaveLength(
      2,
    );
    expect(calling('devoted').abilities.some((a) => a.name === 'Idol')).toBe(false);
    expect(calling('sneaky-bastard').equipment.some((e) => e.name === 'Bump keys')).toBe(false);
  });

  it('records one of the three current cloning techniques through an existing choice type', () => {
    expect(enhancements(calling('sneaky-bastard'), 'rt-cloning-techniques')).toHaveLength(1);
    expect(enhancementManager.getById('rt-cloning-techniques')?.options.map((o) => o.name)).toEqual(
      ['Split Self', 'Shadow Clone', 'Illusory Images'],
    );
  });

  it('renders complete operational rules and working cross-references', () => {
    const cleric = core(calling('cleric-small-gods')).desc!;
    expect(cleric).toContain('<h3>Words of God Modifiers</h3>');
    expect(cleric.match(/<li>/g) ?? []).toHaveLength(10);
    expect(cleric).toContain('roll the Save normally');
    expect(calling('soulbearer').desc).toContain(
      'href="https://www.brighterworldsrpg.com/Callings/Animal\'s%20Companion.html#companion-perks"',
    );
    for (const c of allCallings()) {
      for (const text of [c.desc ?? '', ...c.abilities.map((a) => a.desc ?? '')]) {
        expect(text).not.toContain('[Animal’s Companion list](');
        for (const [, url] of text.matchAll(/href="([^"]+)"/g)) {
          expect(url).not.toMatch(/\s/);
          expect(new URL(url).hostname).toBe('www.brighterworldsrpg.com');
          expect(new URL(url).pathname).toMatch(/\.html$/);
        }
      }
    }
  });

  it('keeps shared Perk and Improvement effects current and suitable for plain-text choice controls', () => {
    const perks = enhancementManager.getById('rt-animal-companion')!.options;
    expect(perks.find((o) => o.name === 'Fast')?.desc).toContain('+1 Armor');
    expect(perks.find((o) => o.name === 'Fast')?.desc).not.toContain('+2 Grit');
    expect(perks.find((o) => o.name === 'Durable')?.desc).toContain('+2 Armor');
    expect(
      enhancementManager
        .getById('rt-artifice-improvements')!
        .options.find((o) => o.name === 'Deadly')?.desc,
    ).toContain('ignore Armor');
    for (const table of enhancementManager.getAll())
      for (const option of table.options) expect(option.desc).not.toMatch(/\]\(|\*\*/);
  });
});
