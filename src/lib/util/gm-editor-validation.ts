import { snapshotState } from './snapshot.svelte';
import { isRollFormula } from './validate';

export function cloneEditorDraft<T>(value: T): T {
  return structuredClone(snapshotState(value));
}

export function parseTableTrigger(value: string | number | [number, number]) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : undefined;
  if (Array.isArray(value)) {
    return value.length === 2 && value.every(Number.isSafeInteger) && value[0] <= value[1]
      ? ([...value] as [number, number])
      : undefined;
  }
  const match = /^\s*(-?\d+)\s*(?:-\s*(-?\d+)\s*)?$/.exec(value);
  if (!match) return undefined;
  const start = Number(match[1]);
  const end = match[2] === undefined ? undefined : Number(match[2]);
  if (!Number.isSafeInteger(start) || (end !== undefined && !Number.isSafeInteger(end))) return;
  return end === undefined ? start : start <= end ? ([start, end] as [number, number]) : undefined;
}

// Match the grammar consumed by rollFormula without rolling during validation.
export function isSupportedRollFormula(value: string) {
  const formula = value.trim();
  if (!isRollFormula(formula)) return false;
  const tokens = formula.replace(/\s/g, '').match(/-?\d*d\d+|-?\d+/g) ?? [];
  let diceCount = 0;
  return tokens.every((token) => {
    if (!token.includes('d')) return Number.isSafeInteger(Number(token));
    const [count, sides] = token.replace(/^-/, '').split('d');
    const n = count === '' ? 1 : Number(count);
    diceCount += n;
    return (
      Number.isSafeInteger(n) &&
      n > 0 &&
      diceCount <= 10000 &&
      Number.isSafeInteger(Number(sides)) &&
      Number(sides) > 0 &&
      Number(sides) <= 0xffffffff
    );
  });
}

export function isOptionalImage(value: string | Blob | undefined) {
  if (value === undefined || value instanceof Blob || !value.trim()) return true;
  const image = value.trim();
  if (/^data:/i.test(image)) return /^data:image\/[a-z0-9.+-]+[;,]/i.test(image);
  try {
    const url = new URL(image, 'https://brighterworlds.app/');
    return ['http:', 'https:', 'blob:'].includes(url.protocol);
  } catch {
    return false;
  }
}
