import type { Ability, Attrs, Calling, CallingEnhancement, Character, CharacterChoice, Entity, HasChoices, Item } from '$lib/types';
import fsm from 'svelte-fsm';
import { manager } from '$lib/data/sheet-manager';
import { get, writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { id } from '$lib/rolling/id';

export const builder = writable<Partial<Character> & HasChoices>({});

const intern: HasChoices = {
  choices: []
};

export const STEP = {
  CALLING: 'calling',
  ATTRIBUTES: 'attributes',
  ABILITIES: 'abilities',
  ENHANCEMENTS: `enhancements`,
  COMPANION: 'companion',
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
      const core = calling.abilities.filter(x => x.type === 'core');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const staticCompanions = calling.abilities.filter(x => x.type === 'companion').map(({choices, ...ab}) => ab as Ability);
      const allChoices = (calling.choices ?? []).concat(core.flatMap(x => x.choices ?? []))
      builder.update(b => ({
        ...b,
        choices: allChoices,
        calling: {
          id: calling.id,
          name: calling.name,
          desc: calling.tagline
        },
        equipment: calling.equipment,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        abilities: staticCompanions.concat(core.map(({choices, ...ab}) => ab)),
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
      if (allChoices.some(x => x.choose === 'enhancement')) {
        return STEP.ENHANCEMENTS;
      }
      if (allChoices.some(x => x.choose === 'linked')) {
        return STEP.COMPANION;
      }
      return STEP.EQUIPMENT;
    }
  },
  [STEP.ENHANCEMENTS]: {
    setEnhancements(enhancements: CallingEnhancement[]) {
      const newAbilities = enhancements.map(x => ({id: id(), name: x.name, desc: x.desc, type: 'enhance', details: x.type} as Ability));
      intern.choices = intern.choices?.filter(x => x.choose !== 'enhancement');
      builder.update(b => ({
        ...b,
        abilities: newAbilities.concat(b.abilities ?? []),
        choices: intern.choices,
      }));
      if (intern.choices?.some(x => x.choose === 'linked')) {
        return STEP.COMPANION;
      }
      return STEP.EQUIPMENT;
    }
  },
  [STEP.COMPANION]: {
    setCompanion(companion: Partial<Character>) {
      const [compId] = manager.create(companion);
      builder.update(b => ({
        ...b,
        abilities: [{id: id(), name: companion.name ?? '', desc: `<a href="/character/${compId}" target="_blank">${companion.name}'s Sheet</a>`, type: 'companion', details: companion.calling?.name ?? ''}, ...(b.abilities ?? [])]
      }));
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


