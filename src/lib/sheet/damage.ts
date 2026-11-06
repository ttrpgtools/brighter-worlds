import { bestRoll } from '$lib/rolling/roll';
import type { DamageForm, DamageDetails, DamageResults } from '$lib/types';
import { status } from '$lib/const';
import { getModDiceSet } from '$lib/rolling/modifier';
import { capArmor, loseAttributeStep } from '$lib/util/character';

export function parseDamage(input: string): number[] {
  const tokens = input.trim().split(/[#*,\s]+/);
  if (!tokens.every((token) => /^\d+$/.test(token) && Number.isSafeInteger(Number(token))))
    return [];
  return tokens.map(Number).filter((amount) => amount > 0);
}

export function calculateDamage(
  character: DamageDetails,
  form: DamageForm | undefined,
): DamageResults | undefined {
  if (!form) return;
  const amounts = parseDamage(form.damage);
  if (!form.wound && amounts.length === 0) return;
  const type = character.type ?? form.type;
  const initialDie = character.dice[type];
  let die = initialDie;
  let grit = character.grit;
  let statuses = new Set(character.statuses);
  const messages: string[] = [];
  const result: DamageResults = { msg: '', dice: [], saves: [], type };

  function wound() {
    const loss = loseAttributeStep(die, statuses);
    die = loss.die;
    statuses = loss.statuses;
  }

  if (form.wound) {
    wound();
    messages.push('You suffered a Wound.');
  } else {
    // Each attack uses the Grit and Attribute remaining after the previous attack.
    for (const [index, amount] of amounts.entries()) {
      const prefix = amounts.length > 1 ? `Attack ${index + 1}: ` : '';
      let remaining = Math.max(0, amount - (form.bypassArmor ? 0 : capArmor(character.armor)));
      if (remaining === 0) {
        messages.push(`${prefix}Your armor protected you from the damage.`);
        continue;
      }
      if (!form.bypassGrit) {
        const used = Math.min(Math.max(0, grit), remaining);
        grit -= used;
        remaining -= used;
      }
      if (remaining === 0) {
        messages.push(`${prefix}Your Grit kept you from harm.`);
        continue;
      }
      messages.push(`${prefix}You took ${remaining} Direct Damage.`);
      while (remaining > 0) {
        if (die === 0) {
          wound();
          break;
        }
        if (remaining >= die) {
          remaining -= die;
          wound();
          messages.push('You automatically suffered a Wound.');
          if (!form.overflow) remaining = 0;
        } else {
          const dice = getModDiceSet(die, character.mod);
          const save = bestRoll(dice);
          result.saves.push({ dice, save, dd: remaining });
          result.dice = dice;
          const wounded = save <= remaining;
          if (wounded) wound();
          messages.push(
            `You rolled ${save} on your Direct Damage Save and ${wounded ? 'suffered' : 'avoided'} a Wound.`,
          );
          remaining = 0;
        }
      }
      if (statuses.has(status.DEAD)) break;
    }
  }

  if (grit !== character.grit) result.grit = grit;
  if (die !== initialDie) result.die = die;
  if (statuses.has(status.DEAD)) messages.push('You died.');
  else if (die === 0 && die !== initialDie) messages.push('You are incapacitated.');
  else if (die !== initialDie) messages.push(`Your ${type.toUpperCase()} is now d${die}.`);
  if (
    statuses.size !== character.statuses.size ||
    [...statuses].some((s) => !character.statuses.has(s))
  )
    result.statuses = statuses;
  result.msg = messages.join(' ');
  return result;
}
