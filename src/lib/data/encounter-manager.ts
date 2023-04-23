import { id } from "$lib/rolling/id";
import type { Encounter, NpcInstance, NpcStats } from "$lib/types";
import { writable, type Writable } from "svelte/store";
import { get } from 'svelte/store';
import { lazyFactory } from "./storage";

const KEY = 'bw-encounters';

export function getNpcInstance(stats: NpcStats) {
  const empty: NpcInstance = {
    id: id(),
    name: stats.name,
    grit: { current: stats.grit, max: stats.grit },
    str: { current: stats.str, max: stats.str },
    dex: { current: stats.dex, max: stats.dex },
    wil: { current: stats.wil, max: stats.wil },
    status: '',
    armor: stats.armor,
    attacks: stats.attacks.map(att => ({
      ...att,
      id: `beastattack-${id()}`,
    })),
    wants: stats.wants,
    found: stats.found,
    notes: stats.notes.slice(),
  };
  return empty;
}

function getEmptyEncounter() {
  const empty: Encounter = {
    id: id(),
    name: 'Untitled',
    npcs: [],
    notes: '',
  };
  return empty;
}

class EncounterManager {
  public list = lazyFactory<Encounter[]>(KEY, []);
  private loaded = false;
  private encCache = new Map<string, Writable<Encounter>>();

  loadList() {
    this.list.load();
    this.loaded = true;
  }

  create(): [string, Writable<Encounter>] {
    if (!this.loaded) {
      this.loadList();
    }
    const fresh = getEmptyEncounter();
    this.list.update((current) => ([...current, fresh]));
    const enc = this.getEncounter(fresh.id, fresh);
    return [fresh.id, enc];
  }

  deleteEncounter(id: string) {
    this.list.update((current) => current.filter(x => x.id !== id));
  }

  getEncounter(id: string, fresh?: Encounter) {
    const enc = writable(getEmptyEncounter());
    if (!this.loaded) return enc;
    const saved = this.encCache.get(id);
    if (saved != null) {
      return saved;
    }
    if (fresh) {
      enc.set(fresh);
    } else {
      const encounters = get(this.list);
      const encounter = encounters.find(x => x.id === id);
      if (!encounter) {
        throw 'NOT FOUND';
      }
      enc.set(encounter);
    }
    enc.subscribe(() => {
      this.list.update(current => current); // Bounce to write.
    });
    this.encCache.set(id, enc);
    return enc;
  }
}

export const encounters = new EncounterManager();
