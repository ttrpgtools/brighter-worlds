import { describe, expect, it } from 'vitest';
import {
  cloneEditorDraft,
  isOptionalImage,
  isSupportedRollFormula,
  parseTableTrigger,
} from './gm-editor-validation';
import { saveTableDraft, tableDraft, tableErrors } from './rolltable-editor';
import type { CustomRolltableDef, Encounter } from '$lib/types';

describe('GM editor validation', () => {
  it('parses only complete ordered integer triggers and preserves zero and negatives', () => {
    expect(parseTableTrigger('0')).toBe(0);
    expect(parseTableTrigger('-3 - -1')).toEqual([-3, -1]);
    expect(parseTableTrigger(' 1 - 4 ')).toEqual([1, 4]);
    for (const bad of ['', '1x', '2.5', '1-2-3', '4-2', '1-', '9007199254740992'])
      expect(parseTableTrigger(bad)).toBeUndefined();
  });
  it('accepts the roller grammar and rejects malformed or impossible dice', () => {
    for (const good of ['d6', '2d6+1', '2*d6 - 1', '-d4+3', '7'])
      expect(isSupportedRollFormula(good), good).toBe(true);
    for (const bad of ['', 'd0', '0d6', '2d6oops', '2.5d6', 'd6/2', '1d', '10001d6', '9999d6+2d6'])
      expect(isSupportedRollFormula(bad), bad).toBe(false);
  });
  it('preserves supported optional image formats', () => {
    for (const image of [
      '',
      '/images/npc.png',
      '../npc.png',
      'https://example.com/a.png',
      'blob:https://example.com/image',
      'data:image/png;base64,AA==',
    ])
      expect(isOptionalImage(image), image).toBe(true);
    expect(isOptionalImage(new Blob(['image']))).toBe(true);
    expect(isOptionalImage('javascript:alert(1)')).toBe(false);
    expect(isOptionalImage('data:text/html,hello')).toBe(false);
  });
});

describe('roll-table draft isolation', () => {
  const encounter: Encounter = { id: 'enc', name: 'Encounter', desc: 'Original', npcs: [] };
  function saved(): CustomRolltableDef {
    return {
      id: 'table',
      name: 'Table',
      formula: 'd6',
      options: [
        { type: 'text', value: 'Original', trigger: [1, 3] },
        { type: 'entity', value: encounter, trigger: 2 },
      ],
    };
  }
  it('discards nested edits and option removal without touching the saved table', () => {
    const source = saved();
    const original = structuredClone(source);
    const draft = tableDraft(source);
    draft.options[0].text = 'Changed';
    draft.options[0].trigger = '4-6';
    draft.options.splice(1, 1);
    expect(source).toEqual(original);
  });
  it('commits independent reference snapshots and retains supported overlap and gap semantics', () => {
    const source = saved();
    const draft = tableDraft(source);
    draft.name = '  Updated  ';
    const result = saveTableDraft(draft, [encounter])!;
    expect(result.name).toBe('Updated');
    expect(result.options.map((row) => row.trigger)).toEqual([[1, 3], 2]);
    const entity = result.options[1];
    if (entity.type === 'entity') entity.value.name = 'Different';
    expect(encounter.name).toBe('Encounter');
    expect(source.name).toBe('Table');
  });
  it('keeps missing references recoverable and refuses malformed drafts', () => {
    const draft = tableDraft(saved());
    expect(tableErrors(draft, []).rows[1].value).toContain('missing');
    expect(saveTableDraft(draft, [])).toBeUndefined();
    draft.options[1].entityId = 'replacement';
    expect(saveTableDraft(draft, [{ id: 'replacement', name: 'Replacement' }])).toBeDefined();
    draft.options[0].trigger = '2oops';
    expect(saveTableDraft(draft, [{ id: 'replacement', name: 'Replacement' }])).toBeUndefined();
  });
  it('deep clones item magic, damage arrays and image blobs for independent drafts', () => {
    const source = {
      damage: [4, 6],
      magic: { charges: { current: 1, max: 3 } },
      image: new Blob(['image']),
    };
    const draft = cloneEditorDraft(source);
    draft.damage[0] = 12;
    draft.magic.charges.current = 0;
    expect(source.damage).toEqual([4, 6]);
    expect(source.magic.charges.current).toBe(1);
    expect(draft.image).toBeInstanceOf(Blob);
  });
});
