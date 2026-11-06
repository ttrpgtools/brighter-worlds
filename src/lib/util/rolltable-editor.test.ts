import { describe, expect, it } from 'vitest';
import type { CustomRolltableDef, NpcStats } from '$lib/types';
import {
  generateTableEntries,
  missingTableRolls,
  parseTableDice,
  saveTableDraft,
  tableDiceFormula,
  tableDraft,
  tableRollRange,
  type TableOptionDraft,
} from './rolltable-editor';

const row = (trigger: string, text = 'Original'): TableOptionDraft => ({
  key: trigger,
  type: 'text',
  trigger,
  text,
  entityId: '',
});

describe('guided table dice', () => {
  it('reads saved dice, sums and modifiers without changing their formula', () => {
    expect(parseTableDice('1d6')).toEqual({ count: 1, sides: 6, modifier: 0 });
    expect(parseTableDice(' 2d6 - 3 ')).toEqual({ count: 2, sides: 6, modifier: -3 });
    expect(parseTableDice('d7+2')).toEqual({ count: 1, sides: 7, modifier: 2 });
    expect(tableDiceFormula({ count: 1, sides: 6, modifier: 0 })).toBe('d6');
    expect(tableDiceFormula({ count: 2, sides: 6, modifier: -3 })).toBe('2d6-3');
    expect(tableDiceFormula({ count: 2, sides: 6, modifier: 2 })).toBe('2d6+2');
  });

  it('uses the true summed range, including zero and negative rolls', () => {
    expect(tableRollRange('2d6')).toEqual({ minimum: 2, maximum: 12, count: 11 });
    expect(tableRollRange('d4-3')).toEqual({ minimum: -2, maximum: 1, count: 4 });
    expect(missingTableRolls('d4-3', [])).toEqual([-2, -1, 0, 1]);
  });

  it('keeps advanced expressions available without guessing their outcomes', () => {
    const table: CustomRolltableDef = {
      id: 'advanced',
      name: 'Advanced',
      formula: '2*d6+1',
      options: [{ type: 'text', value: 'Result', trigger: [3, 13] }],
    };
    const draft = tableDraft(table);
    expect(parseTableDice(draft.formula)).toBeUndefined();
    expect(missingTableRolls(draft.formula, draft.options)).toBeUndefined();
    expect(saveTableDraft(draft, [])).toEqual(table);
  });

  it('rejects invalid dice and totals outside safe integer arithmetic', () => {
    for (const formula of ['d0', '0d6', '2.5d6', 'd6oops', '10001d6', 'd6+9007199254740991']) {
      expect(parseTableDice(formula), formula).toBeUndefined();
    }
    for (const count of [0, NaN, 1.5, 10001]) {
      expect(tableDiceFormula({ count, sides: 6, modifier: 0 })).toBe('');
    }
    expect(tableDiceFormula({ count: 1, sides: 6, modifier: 1.5 })).toBe('');
  });
});

describe('table entry generation', () => {
  it('creates one blank text entry per possible roll with independent keys', () => {
    let key = 0;
    const generated = generateTableEntries('d6', [], () => `new-${++key}`);
    expect(generated.map((entry) => entry.trigger)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(new Set(generated.map((entry) => entry.key)).size).toBe(6);
    expect(
      generated.every(
        (entry) => entry.type === 'text' && entry.text === '' && entry.entityId === '',
      ),
    ).toBe(true);
    expect(missingTableRolls('d6', generated)).toEqual([]);
    expect(generateTableEntries('d6', generated, () => 'unused')).toEqual([]);
  });

  it('fills only gaps and preserves existing content, overlapping ranges and entity selections', () => {
    const existing: TableOptionDraft[] = [
      row('1-3'),
      row('2-4', 'Overlapping result'),
      { ...row('6'), type: 'entity', entityId: 'npc', text: 'Kept while toggled' },
    ];
    const before = structuredClone(existing);
    const generated = generateTableEntries('d6', existing, () => 'new');
    expect(generated).toEqual([{ key: 'new', type: 'text', text: '', entityId: '', trigger: '5' }]);
    expect(existing).toEqual(before);
    expect(missingTableRolls('d6', existing.concat(generated))).toEqual([]);
  });

  it('fills the revised roll range without replacing entries after dice changes', () => {
    const existing = [row('1-6')];
    expect(missingTableRolls('d8', existing)).toEqual([7, 8]);
    expect(missingTableRolls('2d6+1', existing)).toEqual([7, 8, 9, 10, 11, 12, 13]);
    expect(existing).toEqual([row('1-6')]);
  });

  it('bounds automatic generation and leaves unsupported or malformed formulas untouched', () => {
    expect(generateTableEntries('d100', [], () => 'key')).toHaveLength(100);
    for (const formula of ['2d100', '10000d100', 'd6*2', 'd6oops']) {
      expect(missingTableRolls(formula, [])).toBeUndefined();
      expect(generateTableEntries(formula, [row('1-3')], () => 'unused')).toEqual([]);
    }
  });

  it('does not hide or replace malformed saved triggers during generation', () => {
    const existing = [row('1x')];
    expect(missingTableRolls('d4', existing)).toEqual([1, 2, 3, 4]);
    expect(existing[0].trigger).toBe('1x');
  });

  it('requires generated entries to be populated and saves independent mixed results', () => {
    const npc: NpcStats = {
      id: 'npc',
      name: 'Scout',
      grit: 3,
      str: 4,
      dex: 4,
      wil: 4,
      attacks: [],
      notes: ['Quiet'],
    };
    let key = 0;
    const options = generateTableEntries('d2', [], () => `entry-${++key}`);
    const draft = { id: 'table', name: '  Road  ', formula: 'd2', options };
    expect(saveTableDraft(draft, [npc])).toBeUndefined();
    options[0].text = 'A quiet road';
    options[1].type = 'entity';
    options[1].entityId = npc.id;
    const saved = saveTableDraft(draft, [npc])!;
    expect(saved.name).toBe('Road');
    expect(saved.options.map((option) => option.trigger)).toEqual([1, 2]);
    options[0].text = 'Unsaved change';
    expect(saved.options[0].value).toBe('A quiet road');
    if (saved.options[1].type === 'entity') saved.options[1].value.name = 'Changed snapshot';
    expect(npc.name).toBe('Scout');
  });
});
