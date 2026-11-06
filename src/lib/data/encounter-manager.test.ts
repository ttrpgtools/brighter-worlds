import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Encounter } from '$lib/types';
import { get } from 'svelte/store';
import { cloneEditorDraft } from '$lib/util/gm-editor-validation';
import { newNpcDraft, saveEncounterDraft } from '../../routes/gm/template-drafts';

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

  it('creates an unsaved draft and leaves no row when it is discarded', async () => {
    const manager = await getManager();
    const append = vi.spyOn(manager.list, 'appendItem');
    const draft = manager.createDraft();
    draft.name = 'Cancelled';
    draft.npcs.push({ ...newNpcDraft(), name: 'Scout' });
    expect(manager.list.items).toEqual([]);
    expect(append).not.toHaveBeenCalled();
  });

  it('discards nested edits without changing the saved encounter or NPC source', async () => {
    const manager = await getManager();
    const npc = {
      ...newNpcDraft(),
      name: 'Scout',
      attacks: [{ id: 'bow', name: 'Bow', damage: [4, 6] as (4 | 6)[] }],
    };
    const original = { ...encounter, npcs: [npc] };
    manager.list.set([original]);
    const before = structuredClone(original);
    const update = vi.spyOn(manager.list, 'updateItem');
    const draft = cloneEditorDraft(original);
    draft.npcs[0].attacks[0].name = 'Changed';
    (draft.npcs[0].attacks[0].damage as number[])[0] = 12;
    draft.npcs[0].notes.push('Changed');
    draft.npcs.push(cloneEditorDraft(npc));
    expect(manager.list.items).toEqual([before]);
    expect(npc).toEqual(before.npcs[0]);
    expect(update).not.toHaveBeenCalled();
  });

  it('saves a valid draft once, detaches it, and keeps a cached encounter store current', async () => {
    const manager = await getManager();
    manager.list.set([encounter]);
    const cached = manager.getEncounter(encounter.id);
    const update = vi.spyOn(manager.list, 'updateItem');
    const draft = cloneEditorDraft(encounter);
    draft.name = '  Mill Ambush  ';
    draft.npcs.push({ ...newNpcDraft(), name: 'Scout', notes: ['Hidden'] });
    manager.save(saveEncounterDraft(draft));
    expect(update).toHaveBeenCalledTimes(1);
    expect(get(cached).name).toBe('Mill Ambush');
    draft.npcs[0].notes[0] = 'Later unsaved change';
    expect(manager.list.items[0].npcs[0].notes).toEqual(['Hidden']);
    const reloaded = await getManager();
    reloaded.list.set(JSON.parse(JSON.stringify(manager.list.items)));
    expect(reloaded.list.items).toEqual(manager.list.items);
    expect(reloaded.list.items[0].name).toBe('Mill Ambush');
  });

  it('does not save an invalid draft', async () => {
    const manager = await getManager();
    expect(() => manager.save(manager.createDraft())).toThrow('Name');
    expect(manager.list.items).toEqual([]);
  });
});
