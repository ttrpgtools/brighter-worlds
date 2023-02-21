import type { Ability, Attrs, Calling, Character, CharacterChoice, HasChoices, Item } from '$lib/types';
import fsm from 'svelte-fsm';
import { manager } from '$lib/data/sheet-manager';
import { get, writable } from 'svelte/store';
import { goto } from '$app/navigation';

export const builder = writable<Partial<Character> & HasChoices>({});

const intern: HasChoices = {
  choices: []
};

export const STEP = {
  CALLING: 'calling',
  ATTRIBUTES: 'attributes',
  ABILITIES: 'abilities',
  EQUIPMENT: 'equipment',
  MAGIC: 'magic',
  EULOGY: 'eulogy',
  DONE: 'done',
} as const;

export const wizard = fsm(STEP.CALLING, {
  [STEP.CALLING]: {
    _enter() {
      // NOOP
    },
    setCalling(calling: Calling) {
      const allChoices = (calling.choices ?? []).concat(calling.abilities.flatMap(x => x.choices ?? []))
      builder.update(b => ({
        ...b,
        choices: allChoices,
        calling: {
          id: calling.id,
          name: calling.name,
          desc: calling.tagline
        },
        equipment: calling.equipment,
        abilities: calling.abilities.filter(x => x.type === 'core'),
      }));
      intern.choices = allChoices;
      return STEP.ATTRIBUTES;
    }
  },
  [STEP.ATTRIBUTES]: {
    setAttrs(attrs: Attrs) {
      builder.update(b => ({
        ...b,
        str: { current: attrs.str, max: attrs.str },
        dex: { current: attrs.dex, max: attrs.dex },
        wil: { current: attrs.wil, max: attrs.wil },
      }))
      return STEP.ABILITIES;
    }
  },
  [STEP.ABILITIES]: {
    setAbilities(abils: (Ability & HasChoices)[]) {
      const [abilityChoices, abilities] = abils.reduce((p, {choices, ...rest}) => ([
        [...p[0], ...(choices ?? [])],
        [...p[1], rest as Ability]
      ]), [[] as CharacterChoice[], [] as Ability[]]);
      const allChoices = (intern.choices ?? []).concat(abilityChoices);
      builder.update(b => ({
        ...b,
        choices: allChoices,
        abilities: [...(b.abilities ?? []), ...abilities],
      }));
      intern.choices = allChoices;
      return STEP.EQUIPMENT;
    }
  },
  [STEP.EQUIPMENT]: {
    setEquipment(eq: Item[]) {
      const remainingChoices = (intern.choices ?? []).filter(x => x.choose !== 'equipment');
      builder.update(b => ({
        ...b,
        equipment: (b.equipment ?? []).concat(eq),
        choices: remainingChoices,
      }));
      intern.choices = remainingChoices;
      return STEP.DONE;
    }
  },
  [STEP.DONE]: {
    _enter() {
      const {choices, ...char} = get(builder);
      if (choices?.length) {
        // Warn?
      }
      const [newId] = manager.create(char);
      goto(`/character/${newId}/`);
    }
  },
  '*': {
    reset() {
      builder.set({});
      return STEP.CALLING;
    },
    _enter({to}) {
        goto(`/character/new/${String(to)}`);
    },
  }
});


