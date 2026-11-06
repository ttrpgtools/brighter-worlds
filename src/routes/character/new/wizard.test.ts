import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { goto } from '$app/navigation';
import { createSheet } from '$lib/data/sheet-manager';
import { createAccountCharacters } from '$lib/data/account-creation';
import { callingManager } from '$lib/data/calling-manager';
import { spellManager, ritualManager } from '$lib/data/magic-manager';
import { enhancementManager } from '$lib/data/table-manager';
import { buildBundle } from '$lib/data/sheet-format/codec';
import { download } from '$lib/util/download';
import { creationGroups, type CreationSelection } from '$lib/data/character-creation';
import type { AccountSession } from '$lib/data/account-session';
import type { Character } from '$lib/types';
import type { StartingGearPair } from '$lib/data/starting-equipment';
import { createWizard, STEP, WizardBuilder } from './wizard.svelte';

const state = vi.hoisted(() => ({ saved: [] as unknown[], next: 0 }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(async () => {}) }));
vi.mock('$lib/util/track', () => ({ track: vi.fn() }));
vi.mock('$lib/util/download', () => ({ download: vi.fn() }));
vi.mock('$lib/data/sheet-manager', async (original) => {
  const actual = await original<typeof import('$lib/data/sheet-manager')>();
  return {
    ...actual,
    createSheet: vi.fn((partial: Partial<Character>) => {
      const value = {
        ...actual.getEmptySheet(),
        ...structuredClone(partial),
        id: `local-${++state.next}`,
      };
      state.saved.push(value);
      return [value.id, undefined];
    }),
  };
});
vi.mock('$lib/data/account-creation', async (original) => ({
  ...(await original<typeof import('$lib/data/account-creation')>()),
  createAccountCharacters: vi.fn(async () => ''),
}));
const pairs: StartingGearPair[] = [
  ['Haunted', { id: 'whip', name: 'Whip', damage: 6 }],
  ['Flexible', { id: 'bucket', name: 'Bucket' }],
  ['Floating', { id: 'hat', name: 'Hat' }],
];
const spells = spellManager.getAll();
const rituals = ritualManager.getAll();
function start(key: string, storage: 'local' | 'account' = 'local') {
  const builder = new WizardBuilder({} as AccountSession);
  builder.configure(storage, storage === 'account' ? 'owner' : '');
  const wizard = createWizard(builder);
  wizard.send('setCalling', callingManager.getById(`calling-${key}`)!, spells, rituals);
  return { builder, wizard };
}
function attrs(wizard: ReturnType<typeof createWizard>) {
  wizard.send('setAttrs', { str: 8, dex: 6, wil: 4 }, 'Aster');
}
function finishMagic(builder: WizardBuilder, wizard: ReturnType<typeof createWizard>) {
  const count = (type: 'spell' | 'ritual') =>
    builder.sheet.choices?.filter((c) => c.choose === 'magic' && c.type === type).length ?? 0;
  wizard.send(
    'setMagic',
    spells
      .filter((s) => !builder.sheet.spells?.some((m) => m.id === s.id))
      .slice(0, count('spell')),
    rituals
      .filter((s) => !builder.sheet.rituals?.some((m) => m.id === s.id))
      .slice(0, count('ritual')),
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(goto).mockResolvedValue(undefined);
  state.saved = [];
  state.next = 0;
});
afterEach(() => vi.unstubAllGlobals());

describe('wizard transition guards and persistence', () => {
  it('cannot reset the draft while its account save is in progress', async () => {
    let release!: () => void;
    vi.mocked(createAccountCharacters).mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          release = () => resolve('saved');
        }),
    );
    const { builder, wizard } = start('bag-bones', 'account');
    attrs(wizard);
    wizard.send('setEquipment', pairs);
    expect(builder.working).toBe(true);
    wizard.send('reset');
    expect(wizard.current).toBe(STEP.DONE);
    expect(builder.completed).toBeDefined();
    release();
    await vi.waitFor(() => expect(builder.working).toBe(false));
    expect(builder.error).toBe('');
    expect(createAccountCharacters).toHaveBeenCalledTimes(1);
  });

  it('backs up the actual local identities after an interrupted navigation', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.test' } });
    const { builder, wizard } = start('witch');
    attrs(wizard);
    wizard.send(
      'setCompanion',
      callingManager.getById('calling-witch-familiar')!,
      'Pip',
      ['Big', 'Fast', 'Flying'],
      true,
    );
    wizard.send('setEquipment', pairs);
    vi.mocked(goto).mockRejectedValueOnce(new Error('Navigation interrupted'));
    finishMagic(builder, wizard);
    await vi.waitFor(() => expect(builder.working).toBe(false));
    await builder.backup();
    const bundle = JSON.parse(vi.mocked(download).mock.calls[0][0]);
    const [companion, root] = state.saved as Character[];
    expect(bundle.roots).toEqual([root.id]);
    expect(bundle.sheets.map((s: { id: string }) => s.id).sort()).toEqual(
      [companion.id, root.id].sort(),
    );
    expect(bundle.unresolvedRelations).toEqual([]);
  });
  it('blocks incomplete Attributes and direct attempts to save an unfinished draft', async () => {
    const { builder, wizard } = start('alchemist');
    wizard.send('setAttrs', { str: 4, dex: 4, wil: 4 }, 'Aster');
    expect(wizard.current).toBe(STEP.ATTRIBUTES);
    expect(builder.error).toMatch(/one d8/);
    wizard.send('setAttrs', { str: 8, dex: 6, wil: 4 }, ' ');
    expect(wizard.current).toBe(STEP.ATTRIBUTES);
    await builder.finish();
    expect(createSheet).not.toHaveBeenCalled();
    expect(createAccountCharacters).not.toHaveBeenCalled();
  });
  it('does not advance or persist incomplete choice groups and gear', () => {
    const { builder, wizard } = start('runewright');
    attrs(wizard);
    wizard.send('setEnhancements', []);
    expect(wizard.current).toBe(STEP.ENHANCEMENTS);
    expect(builder.error).toMatch(/required choice/);
    const groups = creationGroups(builder.sheet.choices!);
    wizard.send(
      'setEnhancements',
      groups.flatMap(({ table, count }) =>
        table.options.slice(0, count).map((o) => ({ ...o, type: table.type, table: table.id })),
      ),
    );
    expect(wizard.current).toBe(STEP.EQUIPMENT);
    wizard.send('setEquipment', pairs.slice(0, 2));
    expect(wizard.current).toBe(STEP.EQUIPMENT);
    expect(createSheet).not.toHaveBeenCalled();
  });
  it('requires both magic categories and rejects duplicate selections', async () => {
    const { builder, wizard } = start('crystal-wizard');
    attrs(wizard);
    wizard.send('setEquipment', pairs);
    wizard.send('setMagic', [spells[0]], []);
    expect(wizard.current).toBe(STEP.MAGIC);
    wizard.send('setMagic', [spells[0]], [rituals[0], rituals[0]]);
    expect(wizard.current).toBe(STEP.MAGIC);
    expect(createSheet).not.toHaveBeenCalled();
    finishMagic(builder, wizard);
    await vi.waitFor(() => expect(builder.working).toBe(false));
    expect(wizard.current).toBe(STEP.DONE);
    expect(createSheet).toHaveBeenCalledTimes(1);
  });
  it('keeps a valid companion in memory until the entire local character is complete', async () => {
    const { builder, wizard } = start('witch');
    attrs(wizard);
    const template = callingManager.getById('calling-witch-familiar')!;
    wizard.send('setCompanion', template, 'Pip', ['Big', 'Fast']);
    expect(wizard.current).toBe(STEP.COMPANION);
    expect(builder.companions).toEqual([]);
    wizard.send('setCompanion', template, 'Pip', ['Big', 'Fast', 'Flying'], true);
    expect(wizard.current).toBe(STEP.EQUIPMENT);
    expect(builder.companions).toHaveLength(1);
    expect(createSheet).not.toHaveBeenCalled();
    wizard.send('setEquipment', pairs);
    finishMagic(builder, wizard);
    await vi.waitFor(() => expect(builder.working).toBe(false));
    expect(createSheet).toHaveBeenCalledTimes(2);
    const [companion, root] = state.saved as Character[];
    expect(root.abilities.find((a) => a.type === 'companion')!.companionSheetId).toBe(companion.id);
    expect(companion.dex.max).toBe(6);
    expect(companion.grit.max).toBe(2);
    expect(root.spells).toHaveLength(2);
    expect(root.rituals).toHaveLength(1);
    const { bundle } = await buildBundle(
      new Map([root, companion].map((c) => [c.id, c])),
      [root.id],
      null,
    );
    expect(bundle.sheets).toHaveLength(2);
    expect(bundle.unresolvedRelations).toEqual([]);
  });
  it('creates account roots and companions together with portable relations', async () => {
    const { builder, wizard } = start('witch', 'account');
    attrs(wizard);
    wizard.send(
      'setCompanion',
      callingManager.getById('calling-witch-familiar')!,
      'Pip',
      ['Big', 'Fast', 'Flying'],
      true,
    );
    wizard.send('setEquipment', pairs);
    finishMagic(builder, wizard);
    await vi.waitFor(() => expect(builder.working).toBe(false));
    expect(createSheet).not.toHaveBeenCalled();
    expect(createAccountCharacters).toHaveBeenCalledTimes(1);
    const [owner, root, companions] = vi.mocked(createAccountCharacters).mock.calls[0];
    expect(owner).toBe('owner');
    expect(root.abilities.find((a) => a.type === 'companion')!.companionSheetId).toBe(
      companions[0].id,
    );
    expect(root).not.toHaveProperty('choices');
    const { bundle } = await buildBundle(
      new Map([root, ...companions].map((c) => [c.id, c])),
      [root.id],
      null,
    );
    expect(bundle.unresolvedRelations).toEqual([]);
    expect(goto).toHaveBeenLastCalledWith(expect.stringContaining('?account=owner'));
  });
  it('resetting an abandoned companion draft creates no stored sheets', () => {
    const { builder, wizard } = start('animals-companion');
    attrs(wizard);
    wizard.send('setCompanion', callingManager.getById('calling-animal')!, 'Bear', [
      'Big',
      'Fast',
      'Clever',
    ]);
    wizard.send('reset');
    expect(wizard.current).toBe(STEP.CALLING);
    expect(builder.companions).toEqual([]);
    expect(createSheet).not.toHaveBeenCalled();
  });
  it.each(['local', 'account'] as const)(
    'retries navigation without duplicating a completed %s creation',
    async (storage) => {
      const { builder, wizard } = start('bag-bones', storage);
      attrs(wizard);
      vi.mocked(goto).mockRejectedValueOnce(new Error('Navigation interrupted'));
      wizard.send('setEquipment', pairs);
      await vi.waitFor(() => expect(builder.working).toBe(false));
      expect(builder.error).toBe('Navigation interrupted');
      await builder.finish();
      expect(builder.error).toBe('');
      expect(storage === 'local' ? createSheet : createAccountCharacters).toHaveBeenCalledTimes(1);
    },
  );
});

describe('complete published Calling flows', () => {
  it.each(callingManager.getAll())(
    'creates a complete $name without free advanced abilities',
    async (c) => {
      const { builder, wizard } = start(c.id.slice('calling-'.length));
      attrs(wizard);
      if (wizard.current === STEP.ENHANCEMENTS) {
        const selections: CreationSelection[] = creationGroups(
          builder.sheet.choices!,
        ).flatMap<CreationSelection>(({ table, count }) => {
          if (table.type === 'improvement')
            return Array.from({ length: count }, (_, i) => ({
              ...table.options.find((o) => o.name === 'Special')!,
              table: table.id,
              type: table.type,
              target:
                c.id === 'calling-artificer' && i === 0
                  ? builder.sheet.equipment![2].id
                  : builder.sheet.equipment![0].id,
              note: 'A useful custom effect',
            }));
          return table.options.slice(0, count).map((o) => ({
            ...o,
            table: table.id,
            type: table.type,
            grant: o.name === 'Weapon of Faith' ? 'Deadly' : undefined,
          }));
        });
        wizard.send('setEnhancements', selections, 'Bear');
      }
      if (wizard.current === STEP.COMPANION) {
        const linked = builder.sheet.choices!.find((c) => c.choose === 'linked')!;
        if (linked.choose !== 'linked') throw new Error('Missing companion choice');
        wizard.send('setCompanion', callingManager.getById(linked.id)!, 'Pip', [
          'Big',
          'Fast',
          'Clever',
        ]);
      }
      expect(wizard.current, builder.error).toBe(STEP.EQUIPMENT);
      wizard.send('setEquipment', pairs);
      if (wizard.current === STEP.MAGIC) finishMagic(builder, wizard);
      await vi.waitFor(() => expect(builder.working).toBe(false));
      expect(wizard.current, builder.error).toBe(STEP.DONE);
      expect(builder.error).toBe('');
      const root = (state.saved as Character[]).at(-1)!;
      expect(root.name).toBe('Aster');
      expect(root.abilities.some((a) => a.type === 'advanced')).toBe(false);
      expect(root.equipment.some((i) => i.name === 'Haunted Whip')).toBe(true);
      expect(root.equipment.every((i) => i.id)).toBe(true);
      expect(root).not.toHaveProperty('choices');
    },
  );
});
