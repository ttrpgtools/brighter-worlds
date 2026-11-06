import type { Attrs, Calling, Character, HasChoices, Item, Spell, Ritual } from '$lib/types';
import { fsm } from '$lib/util/fsm.svelte';
import { createSheet } from '$lib/data/sheet-manager';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { id } from '$lib/rolling/id';
import { getContext, hasContext, onMount, setContext } from 'svelte';
import { calculateGrit } from '$lib/util/grit';
import { track } from '$lib/util/track';
import { getAccountSession, type AccountSession } from '$lib/data/account-session';
import { createAccountCharacters, newCharacter } from '$lib/data/account-creation';
import { buildBundle } from '$lib/data/sheet-format/codec';
import { download } from '$lib/util/download';
import {
  applyCreationSelections,
  beginCalling,
  buildCompanion,
  requireCreation,
  resolveCreationEquipment,
  validStartingAttributes,
  validateStartingMagic,
  type CreationSelection,
} from '$lib/data/character-creation';
import type { StartingGearPair } from '$lib/data/starting-equipment';

export class WizardBuilder {
  sheet: Partial<Character> & HasChoices = $state({});
  storage: 'local' | 'account' = $state('local');
  owner = '';
  companions: Character[] = [];
  working = $state(false);
  error = $state('');
  ready = false;
  completed?: Character;
  private localCompanions = new Map<string, string>();
  private localRoot?: string;
  private accountCreated = false;
  constructor(private session: AccountSession) {}
  configure(storage: 'local' | 'account', owner = '') {
    this.storage = storage;
    this.owner = owner;
  }
  async finish() {
    if (this.working) return;
    this.working = true;
    this.error = '';
    try {
      const { choices, ...char } = $state.snapshot(this.sheet);
      requireCreation(
        this.ready &&
          !choices?.length &&
          char.name?.trim() &&
          char.str &&
          char.dex &&
          char.wil &&
          validStartingAttributes({ str: char.str.max, dex: char.dex.max, wil: char.wil.max }),
        'Complete each creation step before saving your character.',
      );
      this.completed ??= newCharacter(char);
      if (this.storage === 'account') {
        if (!this.accountCreated) {
          await createAccountCharacters(this.owner, this.completed, this.companions, this.session);
          this.accountCreated = true;
        }
        await goto(
          resolve(`/character/[id]?account=${encodeURIComponent(this.owner)}`, {
            id: this.completed.id,
          }),
        );
      } else {
        // Draft companions stay in memory until the whole wizard is complete.
        for (const companion of this.companions) {
          if (this.localCompanions.has(companion.id)) continue;
          const [localId] = createSheet(structuredClone(companion));
          this.localCompanions.set(companion.id, localId);
        }
        if (!this.localRoot) {
          const abilities = this.completed.abilities.map((ability) =>
            ability.companionSheetId
              ? {
                  ...ability,
                  companionSheetId:
                    this.localCompanions.get(ability.companionSheetId) ?? ability.companionSheetId,
                }
              : ability,
          );
          [this.localRoot] = createSheet({ ...this.completed, abilities });
        }
        await goto(resolve('/character/[id]', { id: this.localRoot }));
      }
    } catch (caught) {
      this.error =
        caught instanceof Error
          ? caught.message
          : 'The character could not be created. Your draft is kept open.';
    } finally {
      this.working = false;
    }
  }
  async backup() {
    try {
      const { choices, ...char } = $state.snapshot(this.sheet);
      let root = this.completed ?? newCharacter(char);
      let companions = this.companions;
      if (this.storage === 'local') {
        root = {
          ...root,
          id: this.localRoot ?? root.id,
          abilities: root.abilities.map((a) =>
            a.companionSheetId
              ? {
                  ...a,
                  companionSheetId:
                    this.localCompanions.get(a.companionSheetId) ?? a.companionSheetId,
                }
              : a,
          ),
        };
        companions = companions.map((c) => ({ ...c, id: this.localCompanions.get(c.id) ?? c.id }));
      }
      const { bundle } = await buildBundle(
        new Map([root, ...companions].map((character) => [character.id, character])),
        [root.id],
        window.location.origin,
      );
      download(JSON.stringify(bundle, null, 2), 'brighter-worlds-creation-draft.json');
    } catch (caught) {
      this.error = String(caught);
    }
  }
  set(value: Partial<Character> & HasChoices) {
    this.sheet = value;
  }
  update(updater: (value: Partial<Character> & HasChoices) => Partial<Character> & HasChoices) {
    this.sheet = updater(this.sheet);
  }
  resetDraft() {
    this.sheet = {};
    this.companions = [];
    this.completed = undefined;
    this.localCompanions.clear();
    this.localRoot = undefined;
    this.accountCreated = false;
    this.ready = false;
    this.error = '';
  }
}

export const STEP = {
  CALLING: 'calling',
  ATTRIBUTES: 'attributes',
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
  | 'setEnhancements'
  | 'setCompanion'
  | 'setEquipment'
  | 'setMagic'
  | 'reset';
const routes = {
  calling: '/character/new',
  attributes: '/character/new/attributes',
  enhancements: '/character/new/enhancements',
  companion: '/character/new/companion',
  equipment: '/character/new/equipment',
  magic: '/character/new/magic',
  done: '/character/new',
} as const;

export function createWizard(builder: WizardBuilder) {
  let availableSpells: Spell[] = [];
  let availableRituals: Ritual[] = [];
  function guarded(action: () => WizardSteps) {
    builder.error = '';
    try {
      return action();
    } catch (caught) {
      builder.error = caught instanceof Error ? caught.message : String(caught);
    }
  }
  function afterChoices() {
    if (builder.sheet.choices?.some((c) => c.choose === 'enhancement' && !c.linked))
      return STEP.ENHANCEMENTS;
    if (builder.sheet.choices?.some((c) => c.choose === 'linked')) return STEP.COMPANION;
    return STEP.EQUIPMENT;
  }
  return fsm<WizardSteps, WizardActions>(STEP.CALLING, {
    [STEP.CALLING]: {
      setCalling(calling: Calling, spells: Spell[], rituals: Ritual[]) {
        return guarded(() => {
          requireCreation(
            !calling.hidden && calling.abilities.some((a) => a.type === 'core'),
            'Choose a Calling.',
          );
          const draft = beginCalling($state.snapshot(calling), spells, rituals);
          builder.resetDraft();
          builder.set(draft);
          availableSpells = structuredClone($state.snapshot(spells));
          availableRituals = structuredClone($state.snapshot(rituals));
          return STEP.ATTRIBUTES;
        });
      },
    },
    [STEP.ATTRIBUTES]: {
      setAttrs(attrs: Attrs, name: string) {
        return guarded(() => {
          requireCreation(validStartingAttributes(attrs), 'Assign one d8, one d6 and one d4.');
          requireCreation(name?.trim(), 'Give your character a name.');
          const grit = calculateGrit(attrs.dex, attrs.wil);
          builder.update((b) => ({
            ...b,
            name: name.trim(),
            grit: { current: grit, max: grit },
            str: { current: attrs.str, max: attrs.str },
            dex: { current: attrs.dex, max: attrs.dex },
            wil: { current: attrs.wil, max: attrs.wil },
          }));
          return afterChoices();
        });
      },
    },
    [STEP.ENHANCEMENTS]: {
      setEnhancements(selections: CreationSelection[], formName = '') {
        return guarded(() => {
          builder.set(
            applyCreationSelections(
              $state.snapshot(builder.sheet),
              $state.snapshot(selections),
              formName,
            ),
          );
          return afterChoices();
        });
      },
    },
    [STEP.COMPANION]: {
      setCompanion(template: Calling, name: string, perks: string[], flies = false) {
        return guarded(() => {
          const choices = builder.sheet.choices ?? [];
          requireCreation(
            choices.some((c) => c.choose === 'linked' && c.id === template.id),
            'Choose the companion for your Calling.',
          );
          const extra = choices.filter((c) => c.choose === 'enhancement' && c.linked).length;
          const partial = buildCompanion($state.snapshot(template), name, perks, flies, extra);
          const companion = newCharacter(partial);
          builder.companions.push(companion);
          builder.update((b) => ({
            ...b,
            choices: choices.filter(
              (c) => c.choose !== 'linked' && !(c.choose === 'enhancement' && c.linked),
            ),
            abilities: [
              {
                id: id(),
                name: companion.name,
                desc: 'Your bonded companion.',
                type: 'companion',
                companionSheetId: companion.id,
                details: template.name,
              },
              ...(b.abilities ?? []),
            ],
          }));
          return afterChoices();
        });
      },
    },
    [STEP.EQUIPMENT]: {
      setEquipment(pairs: StartingGearPair[]) {
        return guarded(() => {
          const generated: Item[] = resolveCreationEquipment(
            $state.snapshot(pairs),
            $state.snapshot(builder.sheet),
          );
          builder.update((b) => ({
            ...b,
            equipment: [...(b.equipment ?? []), ...generated],
            choices: (b.choices ?? []).filter((c) => c.choose !== 'equipment'),
          }));
          return builder.sheet.choices?.some((c) => c.choose === 'magic') ? STEP.MAGIC : STEP.DONE;
        });
      },
    },
    [STEP.MAGIC]: {
      setMagic(spells: Spell[], rituals: Ritual[]) {
        return guarded(() => {
          const choices = builder.sheet.choices ?? [];
          validateStartingMagic(
            choices,
            spells,
            availableSpells,
            builder.sheet.spells ?? [],
            'spell',
          );
          validateStartingMagic(
            choices,
            rituals,
            availableRituals,
            builder.sheet.rituals ?? [],
            'ritual',
          );
          builder.update((b) => ({
            ...b,
            choices: choices.filter((c) => c.choose !== 'magic'),
            spells: [...(b.spells ?? []), ...structuredClone($state.snapshot(spells))],
            rituals: [...(b.rituals ?? []), ...structuredClone($state.snapshot(rituals))],
          }));
          return STEP.DONE;
        });
      },
    },
    [STEP.DONE]: {
      _enter() {
        builder.ready = true;
        track(`finish wizard: ${builder.sheet.calling?.name}`);
        void builder.finish();
      },
    },
    '*': {
      reset() {
        if (builder.working) return;
        builder.resetDraft();
        return STEP.CALLING;
      },
      _enter({ to }) {
        void goto(
          resolve(`${routes[to]}${builder.storage === 'account' ? '?storage=account' : ''}`),
        );
      },
    },
  });
}

const SHEET_WIZARD = 'bw-wizard-sheet';
export function getWizard() {
  let wizard: [ReturnType<typeof createWizard>, WizardBuilder];
  if (!hasContext(SHEET_WIZARD)) {
    const builder = new WizardBuilder(getAccountSession());
    wizard = [createWizard(builder), builder];
    setContext(SHEET_WIZARD, wizard);
  } else wizard = getContext(SHEET_WIZARD);
  return wizard;
}
export function guardWizardStep(wizard: ReturnType<typeof createWizard>, expected: WizardSteps) {
  const [, builder] = getWizard();
  onMount(() => {
    if (wizard.current !== expected)
      void goto(
        resolve(
          `${routes[wizard.current]}${builder.storage === 'account' ? '?storage=account' : ''}`,
        ),
      );
  });
}
