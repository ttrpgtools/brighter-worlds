import type {
  Ability,
  Attrs,
  Calling,
  CallingEnhancement,
  Character,
  CharacterChoice,
  HasChoices,
  Item,
  Spell,
  Ritual,
} from '$lib/types';
import { fsm } from '$lib/util/fsm.svelte';
import { createSheet } from '$lib/data/sheet-manager';
import { goto } from '$app/navigation';
import { id } from '$lib/rolling/id';
import { roll } from '$lib/rolling/roll';
import { defined } from '$lib/util/array';
import { getContext, hasContext, onMount, setContext } from 'svelte';
import { calculateGrit } from '$lib/util/grit';

class WizardBuilder {
  sheet: Partial<Character> & HasChoices = $state({});

  set(value: Partial<Character> & HasChoices) {
    this.sheet = value;
  }

  update(updater: (value: Partial<Character> & HasChoices) => Partial<Character> & HasChoices) {
    this.sheet = updater(this.sheet);
  }
}

type Builder = WizardBuilder;

export const STEP = {
  CALLING: 'calling',
  ATTRIBUTES: 'attributes',
  ABILITIES: 'abilities',
  ENHANCEMENTS: 'enhancements',
  COMPANION: 'companion',
  EQUIPMENT: 'equipment',
  MAGIC: 'magic',
  DONE: 'done',
} as const;

type WizardSteps = (typeof STEP)[keyof typeof STEP];
type WizardActions =
  | 'setCalling'
  | 'setAttrs'
  | 'setAbilities'
  | 'setEnhancements'
  | 'setCompanion'
  | 'setEquipment'
  | 'setMagic'
  | 'reset';

function pickRandom<T>(arr: T[]) {
  const which = roll(arr.length) - 1;
  return arr[which];
}

function createWizard(builder: Builder, intern: HasChoices) {
  return fsm<WizardSteps, WizardActions>(STEP.CALLING, {
    [STEP.CALLING]: {
      _enter() {
        // NOOP
      },
      setCalling(calling: Calling, spells: Spell[], rituals: Ritual[]) {
        const core = calling.abilities.filter((x) => x.type === 'core');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const staticCompanions = calling.abilities
          .filter((x) => x.type === 'companion')
          .map(({ choices, ...ab }) => ab as Ability);
        const allChoices = (calling.choices ?? []).concat(core.flatMap((x) => x.choices ?? []));
        builder.update((b) => ({
          ...b,
          choices: allChoices,
          calling: {
            id: calling.id,
            name: calling.name,
            desc: calling.tagline,
          },
          equipment: calling.equipment,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          abilities: staticCompanions.concat(core.map(({ choices, ...ab }) => ab)),
          spells: (calling.spells ?? [])
            .map((x) => (x === '?' ? pickRandom(spells) : spells.find((y) => y.id === x)))
            .filter(defined),
          rituals: (calling.rituals ?? [])
            .map((x) => (x === '?' ? pickRandom(rituals) : rituals.find((y) => y.id === x)))
            .filter(defined),
        }));
        intern.choices = allChoices;
        return STEP.ATTRIBUTES;
      },
    },
    [STEP.ATTRIBUTES]: {
      setAttrs(attrs: Attrs) {
        const grit = calculateGrit(attrs.dex, attrs.wil);
        builder.update((b) => ({
          ...b,
          grit: { current: grit, max: grit },
          str: { current: attrs.str, max: attrs.str },
          dex: { current: attrs.dex, max: attrs.dex },
          wil: { current: attrs.wil, max: attrs.wil },
        }));
        if (intern.choices?.some((x) => x.choose === 'enhancement' && !x.linked)) {
          return STEP.ENHANCEMENTS;
        }
        if (intern.choices?.some((x) => x.choose === 'linked')) {
          return STEP.COMPANION;
        }
        return STEP.EQUIPMENT;
      },
    },
    [STEP.ABILITIES]: {
      setAbilities(abils: (Ability & HasChoices)[]) {
        const [abilityChoices, abilities] = abils.reduce(
          (p, { choices, ...rest }) => [
            [...p[0], ...(choices ?? [])],
            [...p[1], rest as Ability],
          ],
          [[] as CharacterChoice[], [] as Ability[]],
        );
        const allChoices = (intern.choices ?? []).concat(abilityChoices);
        builder.update((b) => ({
          ...b,
          choices: allChoices,
          abilities: [...(b.abilities ?? []), ...abilities],
        }));
        intern.choices = allChoices;
        if (allChoices.some((x) => x.choose === 'enhancement' && !x.linked)) {
          return STEP.ENHANCEMENTS;
        }
        if (allChoices.some((x) => x.choose === 'linked')) {
          return STEP.COMPANION;
        }
        return STEP.EQUIPMENT;
      },
    },
    [STEP.ENHANCEMENTS]: {
      setEnhancements(enhancements: CallingEnhancement[]) {
        const newAbilities = enhancements.map(
          (x) =>
            ({ id: id(), name: x.name, desc: x.desc, type: 'enhance', details: x.type }) as Ability,
        );
        intern.choices = intern.choices?.filter((x) => x.choose !== 'enhancement');
        builder.update((b) => ({
          ...b,
          abilities: newAbilities.concat(b.abilities ?? []),
          choices: intern.choices,
        }));
        if (intern.choices?.some((x) => x.choose === 'linked')) {
          return STEP.COMPANION;
        }
        return STEP.EQUIPMENT;
      },
    },
    [STEP.COMPANION]: {
      setCompanion(companion: Partial<Character>) {
        const companionSheet = $state.snapshot(companion);
        const [compId] = createSheet(companionSheet);
        builder.update((b) => ({
          ...b,
          abilities: [
            {
              id: id(),
              name: companionSheet.name ?? 'Companion',
              desc: `<a href="/character/${compId}" class="text-purple-700 dark:text-purple-300" target="_blank">${companionSheet.name || `Companion`}'s Sheet</a>`,
              type: 'companion',
              details: companionSheet.calling?.name ?? '',
            },
            ...(b.abilities ?? []),
          ],
        }));
        return STEP.EQUIPMENT;
      },
    },
    [STEP.EQUIPMENT]: {
      setEquipment(eq: Item[]) {
        const remainingChoices = (intern.choices ?? []).filter((x) => x.choose !== 'equipment');
        builder.update((b) => ({
          ...b,
          equipment: (b.equipment ?? []).concat(eq),
          choices: remainingChoices,
        }));
        intern.choices = remainingChoices;
        if (intern.choices?.some((x) => x.choose === 'magic')) {
          return STEP.MAGIC;
        }
        return STEP.DONE;
      },
    },
    [STEP.MAGIC]: {
      setMagic(spells: Spell[], rituals: Ritual[]) {
        const remainingChoices = (intern.choices ?? []).filter((x) => x.choose !== 'magic');
        builder.update((b) => ({
          ...b,
          choices: remainingChoices,
          spells: (b.spells || []).concat(spells),
          rituals: (b.rituals || []).concat(rituals),
        }));
        intern.choices = remainingChoices;
        return STEP.DONE;
      },
    },
    [STEP.DONE]: {
      _enter() {
        const { choices, ...char } = $state.snapshot(builder.sheet);
        if (choices?.length) {
          // Warn?
        }
        const [newId] = createSheet(char);
        goto(`/character/${newId}/`);
      },
    },
    '*': {
      reset() {
        builder.set({});
        return STEP.CALLING;
      },
      _enter({ to }) {
        goto(`/character/new/${String(to)}`);
      },
    },
  });
}

const SHEET_WIZARD = 'bw-wizard-sheet';

export function getWizard() {
  let wizard: [ReturnType<typeof createWizard>, Builder];
  if (!hasContext(SHEET_WIZARD)) {
    const builder = new WizardBuilder();
    const intern: HasChoices = {
      choices: [],
    };
    wizard = [createWizard(builder, intern), builder];
    setContext(SHEET_WIZARD, wizard);
  } else {
    wizard = getContext(SHEET_WIZARD);
  }
  return wizard;
}

export function guardWizardStep(wizard: ReturnType<typeof createWizard>, expected: WizardSteps) {
  onMount(() => {
    if (wizard.current !== expected) {
      goto('/character/new');
    }
  });
}
