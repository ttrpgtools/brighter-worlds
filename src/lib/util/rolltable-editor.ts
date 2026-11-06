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
