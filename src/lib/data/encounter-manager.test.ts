import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, writable, type Updater } from 'svelte/store';
import type { Encounter } from '$lib/types';

vi.mock('./idb-store', () => ({
  createIdbStore<T>(_key: string, initialValue: T) {
    const internal = writable(initialValue);
    return {
      ...internal,
      loaded: Promise.resolve(),
      async set(value: T) {
        internal.set(value);
      },
      async update(updater: Updater<T>) {
        internal.update(updater);
      },
    };
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
  return import('./encounter-manager');
}

describe('encounters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes set encounter values back into the list', async () => {
    const { encounters } = await getManager();
    await encounters.list.set([encounter]);
    const store = encounters.getEncounter(encounter.id);

    store.set({ ...encounter, name: 'The New Mill' });

    expect(get(encounters.list)).toEqual([{ ...encounter, name: 'The New Mill' }]);
  });

  it('writes updated encounter values back into the list', async () => {
    const { encounters } = await getManager();
    await encounters.list.set([encounter]);
    const store = encounters.getEncounter(encounter.id);

    store.update((current) => ({
      ...current,
      desc: 'A lantern burns in the loft.',
    }));

    expect(get(encounters.list)).toEqual([
      {
        ...encounter,
        desc: 'A lantern burns in the loft.',
      },
    ]);
  });

  it('throws an Error when an encounter is missing', async () => {
    const { encounters } = await getManager();

    expect(() => encounters.getEncounter('missing')).toThrow(new Error('Encounter not found'));
  });
});
