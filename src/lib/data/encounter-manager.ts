import { id } from '$lib/rolling/id';
import {
  EMPTY,
  type Encounter,
  type NpcInstance,
  type NpcStats,
  type SheetSettings,
} from '$lib/types';
import { writable, type Updater, type Writable } from 'svelte/store';
import { getContext, hasContext, setContext } from 'svelte';
import { PersistedCollection } from './persisted-collection.svelte';
import { getContextStore } from './settings';

const KEY = 'bw-encounters';
const SETTINGS_KEY = 'bw-encounters-settings';
const ENCOUNTERS_CONTEXT = 'bw-encounters-manager';

export function getNpcInstance(stats: NpcStats) {
  const empty: NpcInstance = {
    id: id(),
    name: stats.name,
    grit: { current: stats.grit, max: stats.grit },
    str: { current: stats.str, max: stats.str },
    dex: { current: stats.dex, max: stats.dex },
    wil: { current: stats.wil, max: stats.wil },
    status: '',
    armor: stats.armor ?? 0,
    attacks: stats.attacks.map((att) => ({
      ...att,
      id: `beastattack-${id()}`,
    })),
    wants: stats.wants,
    found: stats.found,
    notes: stats.notes.slice(),
    image: stats.image,
  };
  return empty;
}

function getEmptyEncounter() {
  const empty: Encounter = {
    id: id(),
    name: 'Untitled',
    npcs: [],
    desc: '',
  };
  return empty;
}

const defaultSettings: SheetSettings = {
  [EMPTY]: true,
  rollToBridge: false,
  rollToDiscord: false,
  discordWebhook: '',
};

export const getEncountersSettings = getContextStore(SETTINGS_KEY, defaultSettings);

export class EncounterManager {
  public list = new PersistedCollection<Encounter>(KEY);
  private encCache = new Map<string, Writable<Encounter>>();

  async create(): Promise<[string, Writable<Encounter>]> {
    const fresh = getEmptyEncounter();
    this.list.appendItem(fresh);
    const enc = this.getEncounter(fresh.id, fresh);
    return [fresh.id, enc];
  }

  deleteEncounter(id: string) {
    this.list.removeItem(id);
    this.encCache.delete(id);
  }

  getEncounter(id: string, fresh?: Encounter) {
    const saved = this.encCache.get(id);
    if (saved != null) {
      return saved;
    }

    let encounter: Encounter;
    if (fresh) {
      encounter = fresh;
    } else {
      const existing = this.list.items.find((x) => x.id === id);
      if (!existing) {
        throw new Error('Encounter not found');
      }
      encounter = existing;
    }

    const enc = this.createEncounterStore(encounter);
    this.encCache.set(id, enc);
    return enc;
  }

  private createEncounterStore(encounter: Encounter): Writable<Encounter> {
    const internal = writable(encounter);
    const save = (value: Encounter) => {
      this.list.updateItem(value);
    };

    return {
      subscribe: internal.subscribe,
      set(value: Encounter) {
        internal.set(value);
        save(value);
      },
      update(updater: Updater<Encounter>) {
        internal.update((current) => {
          const next = updater(current);
          save(next);
          return next;
        });
      },
    };
  }
}

export function getEncounters() {
  let manager: EncounterManager;
  if (!hasContext(ENCOUNTERS_CONTEXT)) {
    manager = new EncounterManager();
    setContext(ENCOUNTERS_CONTEXT, manager);
  } else {
    manager = getContext(ENCOUNTERS_CONTEXT);
  }
  return manager;
}
