import { die } from './die';
import { browserCrypto } from './browser-crypto';
import { isNumeric, isSimpleRollFormula } from '$lib/util/validate';
import type { DieValue } from '$lib/types';
import { knownDie } from '$lib/dice/Die.svelte';

export function roll(sides: number) {
  return die(sides)(browserCrypto);
}

export function rolls(sides: number, count = 5) {
  const roller = die(sides);
  return Array.from(Array(count), () => roller(browserCrypto))
}

export function bestRoll(dice: number[]) {
  return dice.reduce((p, c) => Math.max(roll(c), p), 0);
}

function parseFactor(factor: string) {
  if (!factor) return 0;
  const neg = factor.at(0) === '-';
  console.log(`factor = ${factor}`);
  if (neg) factor = factor.substring(1);
  const [count, sides] = factor.split('d');
  if (!sides) return 0;
  console.log(`count = ${count} sides = ${sides}`);
  const value = rolls(parseInt(sides, 10), parseInt(count || '1', 10)).reduce((p, c) => p + c, 0) * (neg ? -1 : 1);
  console.log(value);
  return value;
}

function parseTerm(term: string) {
  if (!term) return 0;
  console.log(`term = ${term}`);
  const factors = term.split('*');
  const value = factors.reduce((p, c) => p * (isNumeric(c) ? parseInt(c, 10) : parseFactor(c)), 1);
  console.log(value);
  return value;
}

/**
 * 
 * @param formula A simple dice formula.
 */
export function rollFormula(formula: string) {
  if (!formula) return 0;
  console.log(`formula = ${formula}`);
  const terms = formula.replace(/\s/g, '').replace(/(\d)-/g, '$1+-').split('+');
  const value = terms.reduce((p, c) => p + parseTerm(c), 0);
  console.log(value);
  return value;
}

export class Formula {
  public simple: boolean;
  public dice: DieValue[];

  constructor(public formula: string) {
    this.simple = isSimpleRollFormula(formula);
    const formulaDie = this.simple ? parseInt(formula?.replace(/1?d/, '') ?? '0', 10) : 0;
    this.dice = knownDie(formulaDie) ? [formulaDie] : [];
  }

  roll() {
    return rollFormula(this.formula);
  }
}
