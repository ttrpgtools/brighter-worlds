import type {
  Ability,
  Attrs,
  Calling,
  CallingEnhancement,
  Character,
  CharacterChoice,
  HasChoices,
  Item,
  Ritual,
  Spell,
} from '$lib/types';
import { id } from '$lib/rolling/id';
import { roll } from '$lib/rolling/roll';
import { stepUp } from '$lib/dice';
import { calculateGrit } from '$lib/util/grit';
import { enhancementManager } from './table-manager';
import { combineStartingGear, type StartingGearPair } from './starting-equipment';
import equipment from '$data/equipment.json';

export type CreationDraft = Partial<Character> & HasChoices;
export interface CreationSelection extends CallingEnhancement {
  table: string;
  target?: string;
  note?: string;
  grant?: string;
}
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export const validStartingAttributes = (attrs: Attrs) =>
  Object.values(attrs)
    .sort((a, b) => a - b)
    .join(',') === '4,6,8';
export function requireCreation(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function freshItems(items: Item[]): Item[] {
  return structuredClone(items).map((item) => ({ ...item, id: id() }));
}
export function beginCalling(
  calling: Calling,
  spells: Spell[],
  rituals: Ritual[],
  random = roll,
): CreationDraft {
  function magic<T extends Spell | Ritual>(ids: string[] = [], list: T[]): T[] {
    return ids.map((key) => {
      const found = key === '?' ? list[random(list.length) - 1] : list.find((m) => m.id === key);
      requireCreation(found, 'Starting magic could not be found. Please choose the Calling again.');
      return structuredClone(found);
    });
  }
  const abilities = calling.abilities.filter((a) => a.type === 'core' || a.type === 'companion');
  return {
    name: '',
    calling: { id: calling.id, name: calling.name, desc: calling.tagline },
    equipment: freshItems(calling.equipment),
    abilities: structuredClone(abilities).map(({ choices, ...ability }) => ability),
    choices: structuredClone([
      ...(calling.choices ?? []),
      ...abilities.filter((a) => a.type === 'core').flatMap((a) => a.choices ?? []),
    ]),
    spells: magic(calling.spells, spells),
    rituals: magic(calling.rituals, rituals),
  };
}

export function creationGroups(choices: CharacterChoice[]) {
  const groups = new Map<string, number>();
  for (const c of choices)
    if (c.choose === 'enhancement' && !c.linked)
      groups.set(c.table, (groups.get(c.table) ?? 0) + 1);
  return [...groups].map(([table, count]) => {
    const definition = enhancementManager.getById(table);
    requireCreation(definition, `The ${table} choice table is unavailable.`);
    return { table: definition, count };
  });
}

export function validateCreationSelections(
  draft: CreationDraft,
  selections: CreationSelection[],
  formName = '',
) {
  const groups = creationGroups(draft.choices ?? []);
  requireCreation(
    selections.length === groups.reduce((n, g) => n + g.count, 0),
    'Complete every required choice before continuing.',
  );
  for (const { table, count } of groups) {
    const selected = selections.filter((s) => s.table === table.id);
    requireCreation(selected.length === count, `Choose ${count} from ${table.name}.`);
    if (table.type !== 'improvement')
      requireCreation(
        new Set(selected.map((s) => s.name)).size === count,
        `Choose different options from ${table.name}.`,
      );
    for (const selection of selected) {
      requireCreation(
        selection.type === table.type && table.options.some((o) => o.name === selection.name),
        `Choose a listed option from ${table.name}.`,
      );
      if (table.type === 'improvement') {
        requireCreation(
          draft.equipment?.some((e) => e.id === selection.target),
          'Assign each Improvement to an item.',
        );
        if (['Ward', 'Locomoting', 'Detecting', 'Special'].includes(selection.name))
          requireCreation(selection.note?.trim(), `Describe the ${selection.name} Improvement.`);
      }
      if (table.id === 'rt-devoted-boons' && selection.name === 'Weapon of Faith')
        requireCreation(
          enhancementManager
            .getById('rt-artifice-improvements')
            ?.options.some((o) => o.name === selection.grant),
          'Choose the Improvement granted by Weapon of Faith.',
        );
    }
    if (table.type === 'improvement' && draft.calling?.id === 'calling-artificer')
      requireCreation(
        selected[0].target === draft.equipment?.[2]?.id,
        'The first Improvement belongs to your Masterwork Tool.',
      );
  }
  if (draft.calling?.id === 'calling-soulbearer')
    requireCreation(formName.trim(), 'Name the creature whose Great Soul you bear.');
}

export function improveItem(original: Item, selections: CreationSelection[]): Item {
  const item = structuredClone(original);
  const notes = selections.map(
    (s) => `${s.name}: ${s.desc}${s.note?.trim() ? ` ${s.note.trim()}` : ''}`,
  );
  for (const s of selections) {
    if ((s.name === 'Deadly' || s.name === 'Heavy') && item.damage)
      item.damage = Array.isArray(item.damage) ? item.damage.map(stepUp) : stepUp(item.damage);
    if (s.name === 'Extra Protection') item.armor = (item.armor ?? 0) + 1;
    if (s.name === 'Paired') item.quantity = (item.quantity ?? 1) * 2;
  }
  if (selections.some((s) => s.name === 'Heavy' || s.name === 'Extra Protection'))
    item.bulky = true;
  if (selections.some((s) => s.name === 'Light')) item.bulky = false;
  if (notes.length) item.desc = [item.desc, ...notes].filter(Boolean).join(' ');
  return item;
}

export function perkStats(attrs: Attrs, grit: number, names: string[]) {
  const next = { ...attrs };
  if (names.includes('Big')) next.str = stepUp(next.str);
  if (names.includes('Fast')) next.dex = stepUp(next.dex);
  if (names.includes('Clever')) next.wil = stepUp(next.wil);
  return {
    attrs: next,
    grit:
      grit +
      calculateGrit(next.dex, next.wil) -
      calculateGrit(attrs.dex, attrs.wil) +
      names.filter((n) => ['Tiny', 'Invertebrate', 'Tricky'].includes(n)).length * 2,
    armor: (names.includes('Fast') ? 1 : 0) + (names.includes('Durable') ? 2 : 0),
    attackSteps: Number(names.includes('Big')) + Number(names.includes('Vicious')),
  };
}

export function applyCreationSelections(
  draft: CreationDraft,
  selections: CreationSelection[],
  formName = '',
): CreationDraft {
  validateCreationSelections(draft, selections, formName);
  const normalized = selections.map((s) => ({
    ...s,
    desc: enhancementManager.getById(s.table)!.options.find((o) => o.name === s.name)!.desc,
  }));
  const form = draft.calling?.id === 'calling-soulbearer';
  const abilities: Ability[] = normalized.map((s) => {
    let description = s.desc + (s.note?.trim() ? ` ${s.note.trim()}` : '');
    if (s.grant) {
      const improvement = enhancementManager
        .getById('rt-artifice-improvements')!
        .options.find((o) => o.name === s.grant)!;
      description += ` ${improvement.name}: ${improvement.desc} Applies to weapons you hold.`;
    }
    return {
      id: id(),
      name: s.name,
      desc: esc(description),
      type: 'enhance',
      details: form && s.table === 'rt-animal-companion' ? 'form perk' : s.type,
    };
  });
  let items = (draft.equipment ?? []).map((item) =>
    improveItem(
      item,
      normalized.filter((s) => s.type === 'improvement' && s.target === item.id),
    ),
  );
  if (normalized.some((s) => s.table === 'rt-water-blessing' && s.name === 'Thermo Regulation'))
    items = items.map((item) =>
      item.name === 'Water' && typeof item.damage === 'number'
        ? { ...item, damage: stepUp(item.damage) }
        : item,
    );
  if (form) {
    requireCreation(
      draft.str && draft.dex && draft.wil && draft.grit,
      'Choose your Attributes first.',
    );
    const stats = perkStats(
      { str: draft.str.max, dex: draft.dex.max, wil: draft.wil.max },
      draft.grit.max,
      normalized.filter((s) => s.table === 'rt-animal-companion').map((s) => s.name),
    );
    const attack = stats.attackSteps
      ? ` Step your form's attack up ${stats.attackSteps} ${stats.attackSteps === 1 ? 'step' : 'steps'}.`
      : '';
    const description = `While transformed: STR d${stats.attrs.str}, DEX d${stats.attrs.dex}, WIL d${stats.attrs.wil}, Max Grit ${stats.grit}; +${stats.armor} Armor from Perks.${attack} Agree its natural attack with the GM. These Perks apply only in this form. Keep Grit and Attribute loss between forms; transforming does not heal you.`;
    abilities.push({
      id: id(),
      name: `${formName.trim()} form`,
      desc: esc(description),
      type: 'enhance',
      details: 'Great Soul form',
    });
    items = items.map((item) =>
      item.name === 'Your Great Soul'
        ? { ...item, name: `Great Soul: ${formName.trim()}`, desc: description }
        : item,
    );
  }
  return {
    ...draft,
    equipment: items,
    abilities: [...abilities, ...(draft.abilities ?? [])],
    choices: (draft.choices ?? []).filter((c) => c.choose !== 'enhancement' || c.linked),
  };
}

export function buildCompanion(
  template: Calling,
  name: string,
  names: string[],
  flies = false,
  extraPerks = 0,
): Partial<Character> {
  const count =
    (template.choices ?? []).filter((c) => c.choose === 'enhancement').length + extraPerks;
  const options = enhancementManager.getById('rt-animal-companion')!.options;
  requireCreation(name.trim(), 'Give your companion a name.');
  requireCreation(
    names.length === count &&
      new Set(names).size === count &&
      names.every((n) => options.some((o) => o.name === n)),
    `Choose ${count} different Companion Perks.`,
  );
  requireCreation(!flies || names.includes('Flying'), 'A flying creature needs the Flying Perk.');
  const stats = perkStats(template.attrs ?? { str: 4, dex: 4, wil: 4 }, template.grit ?? 1, names);
  const items = freshItems(template.equipment).map((item) => {
    if (!item.damage) return item;
    let damage = item.damage;
    for (let i = 0; i < stats.attackSteps; i++)
      damage = Array.isArray(damage) ? damage.map(stepUp) : stepUp(damage);
    const vicious = names.includes('Vicious')
      ? ' Vicious: choose an additional effect with the GM (poison, armor piercing, blast, or similar).'
      : '';
    return { ...item, damage, desc: (item.desc ?? '') + vicious };
  });
  if (stats.armor)
    items.push({
      id: id(),
      name: 'Natural Armor',
      armor: stats.armor,
      desc: 'Armor provided by Companion Perks.',
    });
  return {
    name: name.trim(),
    calling: { id: template.id, name: template.name, desc: template.tagline },
    str: { current: stats.attrs.str, max: stats.attrs.str },
    dex: { current: stats.attrs.dex, max: stats.attrs.dex },
    wil: { current: stats.attrs.wil, max: stats.attrs.wil },
    grit: { current: stats.grit, max: stats.grit },
    equipment: items,
    abilities: [
      { id: id(), name: `${template.name} bond`, type: 'core', desc: template.desc },
      ...names.map(
        (name): Ability => ({
          id: id(),
          name,
          desc: esc(options.find((o) => o.name === name)!.desc),
          type: 'enhance',
          details: 'perk',
        }),
      ),
    ],
  };
}

export function resolveCreationEquipment(pairs: StartingGearPair[], draft: CreationDraft): Item[] {
  const expected = 3 + (draft.choices ?? []).filter((c) => c.choose === 'equipment').length;
  requireCreation(
    pairs.length === expected &&
      Array.from({ length: expected }, (_, i) => pairs[i]).every((p) => p?.[0] && p[1]),
    'Roll every starting equipment table before continuing.',
  );
  const generated = pairs.map((pair) => combineStartingGear(pair)!);
  const poor = draft.abilities?.some((a) => a.name === 'Poverty' && a.details === 'vow');
  const coins = poor ? [] : freshItems(equipment.starting as Item[]);
  return [...coins, ...generated];
}

export function validateStartingMagic(
  choices: CharacterChoice[],
  chosen: (Spell | Ritual)[],
  available: (Spell | Ritual)[],
  owned: (Spell | Ritual)[],
  type: 'spell' | 'ritual',
) {
  const needed = choices.filter((c) => c.choose === 'magic' && c.type === type).length;
  requireCreation(
    chosen.length === needed &&
      new Set(chosen.map((m) => m.id)).size === needed &&
      chosen.every(
        (m) =>
          m.type === type &&
          available.some((a) => a.id === m.id) &&
          !owned.some((a) => a.id === m.id),
      ),
    `Choose ${needed} different ${type}${needed === 1 ? '' : 's'} that you do not already know.`,
  );
}
