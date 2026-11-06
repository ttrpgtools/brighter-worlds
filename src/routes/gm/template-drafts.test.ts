import { describe, expect, it } from 'vitest';
import { getNpcInstance } from '$lib/data/encounter-manager';
import { cloneEditorDraft } from '$lib/util/gm-editor-validation';
import {
  newNpcDraft,
  npcErrors,
  saveNpcDraft,
  saveEncounterDraft,
  newEncounterDraft,
} from './template-drafts';

describe('GM template drafts', () => {
  it('keeps NPC notes and multi-die attacks isolated on cancel and save', () => {
    const original = {
      ...newNpcDraft(),
      name: '  Scout  ',
      wants: '',
      found: '',
      image: '/scout.png',
      notes: ['Quiet'],
      attacks: [{ id: 'bow', name: 'Bow', damage: [4, 6] as (4 | 6)[] }],
    };
    const before = structuredClone(original);
    const draft = cloneEditorDraft(original);
    draft.attacks[0].name = 'Longbow';
    draft.notes[0] = 'Watching';
    expect(original).toEqual(before);
    const saved = saveNpcDraft(draft);
    expect(saved).toMatchObject({
      name: 'Scout',
      image: '/scout.png',
      wants: '',
      found: '',
      notes: ['Watching'],
      attacks: [{ name: 'Longbow', damage: [4, 6] }],
    });
    draft.attacks[0].name = 'Unsaved';
    expect(saved.attacks[0].name).toBe('Longbow');
    expect(JSON.parse(JSON.stringify(saved))).toEqual(saved);
  });

  it('rejects blank names, malformed numeric values, dice and unsafe image formats', () => {
    const npc = newNpcDraft();
    npc.grit = NaN;
    npc.armor = -1;
    npc.str = 3 as 4;
    npc.image = 'javascript:alert(1)';
    expect(npcErrors(npc)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Name:'),
        expect.stringContaining('Grit:'),
        expect.stringContaining('Armor:'),
        expect.stringContaining('STR:'),
        expect.stringContaining('Image:'),
      ]),
    );
    expect(() => saveNpcDraft(npc)).toThrow();
    expect(() => saveEncounterDraft(newEncounterDraft())).toThrow('Name');
  });

  it('creates independent mat combatants including damage arrays', () => {
    const template = {
      ...newNpcDraft(),
      name: 'Scout',
      attacks: [{ id: 'bow', name: 'Bow', damage: [4, 6] as (4 | 6)[] }],
      notes: ['Quiet'],
    };
    const first = getNpcInstance(template);
    const second = getNpcInstance(template);
    first.grit.current = 0;
    first.notes[0] = 'Changed';
    (first.attacks[0].damage as number[])[0] = 12;
    expect(first.id).not.toBe(second.id);
    expect(first.attacks[0].id).not.toBe(second.attacks[0].id);
    expect(second.grit.current).toBe(template.grit);
    expect(second.notes).toEqual(['Quiet']);
    expect(second.attacks[0].damage).toEqual([4, 6]);
    expect(template.attacks[0].damage).toEqual([4, 6]);
  });

  it('permits optional fields and repeated encounter members without sharing them', () => {
    const npc = { ...newNpcDraft(), name: 'Scout', armor: undefined };
    const draft = {
      ...newEncounterDraft(),
      name: '  Patrol  ',
      npcs: [cloneEditorDraft(npc), cloneEditorDraft(npc)],
    };
    expect(npcErrors(npc)).toEqual([]);
    const saved = saveEncounterDraft(draft);
    saved.npcs[0].notes.push('First only');
    expect(saved.npcs[1].notes).toEqual([]);
    expect(draft.npcs[0].notes).toEqual([]);
    expect(saved.name).toBe('Patrol');
  });
});
