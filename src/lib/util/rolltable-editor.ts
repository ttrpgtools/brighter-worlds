import type { CustomRolltableDef, Entity } from '$lib/types';
import {
  cloneEditorDraft,
  isSupportedRollFormula,
  parseTableTrigger,
} from './gm-editor-validation';

export interface TableOptionDraft {
  key: string;
  type: 'text' | 'entity';
  text: string;
  entityId: string;
  trigger: string;
}
export interface TableDraft {
  id: string;
  name: string;
  formula: string;
  options: TableOptionDraft[];
}

export interface TableDice {
  count: number;
  sides: number;
  modifier: number;
}

export const MAX_GENERATED_TABLE_ENTRIES = 100;

export function parseTableDice(formula: string): TableDice | undefined {
  if (!isSupportedRollFormula(formula)) return;
  const match = /^(\d*)d(\d+)(?:([+-])(\d+))?$/.exec(formula.replace(/\s/g, ''));
  if (!match) return;
  const dice = {
    count: Number(match[1] || 1),
    sides: Number(match[2]),
    modifier: Number(match[4] || 0) * (match[3] === '-' ? -1 : 1),
  };
  const minimum = dice.count + dice.modifier;
  const maximum = dice.count * dice.sides + dice.modifier;
  return Number.isSafeInteger(minimum) && Number.isSafeInteger(maximum) ? dice : undefined;
}

export function tableDiceFormula(dice: TableDice) {
  if (
    !Number.isSafeInteger(dice.count) ||
    dice.count < 1 ||
    !Number.isSafeInteger(dice.sides) ||
    dice.sides < 1 ||
    !Number.isSafeInteger(dice.modifier)
  )
    return '';
  const modifier =
    dice.modifier === 0 ? '' : dice.modifier > 0 ? `+${dice.modifier}` : String(dice.modifier);
  const formula = `${dice.count === 1 ? '' : dice.count}d${dice.sides}${modifier}`;
  return parseTableDice(formula) ? formula : '';
}

export function tableRollRange(formula: string) {
  const dice = parseTableDice(formula);
  if (!dice) return;
  const minimum = dice.count + dice.modifier;
  const maximum = dice.count * dice.sides + dice.modifier;
  return { minimum, maximum, count: maximum - minimum + 1 };
}

// Existing ranges and overlapping results keep their meaning. Only uncovered rolls get rows.
export function missingTableRolls(formula: string, options: TableOptionDraft[]) {
  const range = tableRollRange(formula);
  if (!range || range.count > MAX_GENERATED_TABLE_ENTRIES) return;
  const triggers = options.map((option) => parseTableTrigger(option.trigger));
  return Array.from({ length: range.count }, (_, index) => range.minimum + index).filter(
    (roll) =>
      !triggers.some((trigger) =>
        Array.isArray(trigger) ? trigger[0] <= roll && roll <= trigger[1] : trigger === roll,
      ),
  );
}

export function generateTableEntries(
  formula: string,
  options: TableOptionDraft[],
  makeKey: () => string,
): TableOptionDraft[] {
  return (missingTableRolls(formula, options) ?? []).map((roll) => ({
    key: makeKey(),
    type: 'text',
    text: '',
    entityId: '',
    trigger: String(roll),
  }));
}

export function tableDraft(existing: CustomRolltableDef): TableDraft {
  return {
    id: existing.id,
    name: existing.name,
    formula: existing.formula,
    options: existing.options.map((opt, index) => ({
      key: `${existing.id}-${index}`,
      type: opt.type,
      text: opt.type === 'text' ? opt.value : '',
      entityId: opt.type === 'entity' ? (opt.value?.id ?? '') : '',
      trigger: Array.isArray(opt.trigger) ? opt.trigger.join('-') : String(opt.trigger),
    })),
  };
}

export function tableErrors(form: TableDraft, entities: Entity[]) {
  return {
    name: form.name.trim() ? '' : 'Enter a name.',
    formula: isSupportedRollFormula(form.formula)
      ? ''
      : 'Enter a supported dice formula, such as d6 or 2d6+1 (up to 10,000 dice).',
    options: form.options.length ? '' : 'Add at least one option.',
    rows: form.options.map((option) => ({
      trigger:
        parseTableTrigger(option.trigger) !== undefined
          ? ''
          : 'Use an integer or an ordered range, such as 1-3.',
      value:
        option.type === 'text'
          ? option.text.trim()
            ? ''
            : 'Enter result text.'
          : entities.some((entity) => entity.id === option.entityId)
            ? ''
            : 'This reference is missing. Choose an available entity or remove this option.',
    })),
  };
}

export function saveTableDraft(
  form: TableDraft,
  entities: Entity[],
): CustomRolltableDef | undefined {
  const errors = tableErrors(form, entities);
  if (
    errors.name ||
    errors.formula ||
    errors.options ||
    errors.rows.some((row) => row.trigger || row.value)
  )
    return;
  return {
    id: form.id,
    name: form.name.trim(),
    formula: form.formula.trim(),
    options: form.options.map((option) =>
      option.type === 'text'
        ? {
            type: 'text',
            value: option.text,
            trigger: parseTableTrigger(option.trigger)!,
          }
        : {
            type: 'entity',
            value: cloneEditorDraft(entities.find((entity) => entity.id === option.entityId)!),
            trigger: parseTableTrigger(option.trigger)!,
          },
    ),
  };
}
