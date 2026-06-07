import { id } from '$lib/rolling/id';
import {
  EMPTY,
  type Encounter,
  type NpcInstance,
  type NpcStats,
  type SheetSettings,
} from '$lib/types';
import { writable, type Updater, type Writable } from 'svelte/store';
import { get } from 'svelte/store';
import { createIdbStore } from './idb-store';
import { getContextStore } from './settings';

const KEY = 'bw-encounters';
const SETTINGS_KEY = 'bw-encounters-settings';

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

class EncounterManager {
  public list = createIdbStore<Encounter[]>(KEY, [], false);
  private encCache = new Map<string, Writable<Encounter>>();

  async create(): Promise<[string, Writable<Encounter>]> {
    const fresh = getEmptyEncounter();
    this.list.update((current) => [...current, fresh]);
    const enc = this.getEncounter(fresh.id, fresh);
    return [fresh.id, enc];
  }

  deleteEncounter(id: string) {
    this.list.update((current) => current.filter((x) => x.id !== id));
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
      const encounters = get(this.list);
      const existing = encounters.find((x) => x.id === id);
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
      this.list.update((current) => {
        const index = current.findIndex((item) => item.id === value.id);
        if (index === -1) return [...current, value];

        const next = current.slice();
        next[index] = value;
        return next;
      });
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

export const encounters = new EncounterManager();
