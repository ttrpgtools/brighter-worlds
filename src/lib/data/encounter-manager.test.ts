import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Encounter } from '$lib/types';

vi.mock('./persisted-collection.svelte', () => ({
  PersistedCollection: class PersistedCollection<T extends { id: string }> {
    items: T[] = [];

    set(items: T[]) {
      this.items = items;
    }

    appendItem(item: T) {
      this.items = [...this.items, item];
      return item;
    }

    updateItem(item: T) {
      this.items = this.items.map((current) => (current.id === item.id ? item : current));
    }

    removeItem(id: string) {
      this.items = this.items.filter((current) => current.id !== id);
    }
  },
}));

const encounter: Encounter = {
  id: 'encounter-1',
  name: 'The Old Mill',
  desc: '',
  npcs: [],
};

async function getManager() {
  vi.resetModules();
  const { EncounterManager } = await import('./encounter-manager');
  return new EncounterManager();
}

describe('encounters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes set encounter values back into the list', async () => {
    const encounters = await getManager();
    encounters.list.set([encounter]);
    const store = encounters.getEncounter(encounter.id);

    store.set({ ...encounter, name: 'The New Mill' });

    expect(encounters.list.items).toEqual([{ ...encounter, name: 'The New Mill' }]);
  });

  it('writes updated encounter values back into the list', async () => {
    const encounters = await getManager();
    encounters.list.set([encounter]);
    const store = encounters.getEncounter(encounter.id);

    store.update((current: Encounter) => ({
      ...current,
      desc: 'A lantern burns in the loft.',
    }));

    expect(encounters.list.items).toEqual([
      {
        ...encounter,
        desc: 'A lantern burns in the loft.',
      },
    ]);
  });

  it('throws an Error when an encounter is missing', async () => {
    const encounters = await getManager();

    expect(() => encounters.getEncounter('missing')).toThrow(new Error('Encounter not found'));
  });
});
