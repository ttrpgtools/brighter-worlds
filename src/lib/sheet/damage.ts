import { stepDown } from "$lib/dice";
import { bestRoll } from "$lib/rolling/roll";
import type { DamageForm, DieValue, DamageDetails, DamageResults, DieRollSet } from "$lib/types";
import { status } from '$lib/const';
import { getModDiceSet } from "$lib/rolling/modifier";

const ENDGAME = {
  str: { msg: 'You died.', status: status.DEAD },
  dex: { msg: 'You are paralysed.', status: status.PARALYSED },
  wil: { msg: 'You are catatonic.', status: status.CATATONIC },
};

export function calculateDamage(character: DamageDetails, howmuch: DamageForm | undefined) {
  if (howmuch == null || howmuch.damage === '') return;
  const dmgType = character.type ?? howmuch.type;
  const allDmg = howmuch.damage.split(/[#*,\s]+/);
  const allAmt = allDmg.map(x => parseInt(x, 10)).filter(x => !Number.isNaN(x) && x !== 0);
  if (allAmt.length === 0) return;
  let unmitigated = 0;
  if (!howmuch.bypassArmor) {
    unmitigated = allAmt.reduce((p, c) => p + Math.max(c - character.armor, 0), 0);
    if (unmitigated <= 0) {
      return { msg: 'Your armor protected you from the damage.', dice: [], type: dmgType };
    }
  } else {
    unmitigated = allAmt.reduce((p, c) => p + c, 0);
  }
  
  const result: DamageResults = { msg: '', dice: [], type: dmgType };
  if (!howmuch.bypassGrit) {
    if (character.grit > 0) {
      const gritUsed = Math.min(character.grit, unmitigated);
      result.grit = character.grit - gritUsed;
      unmitigated -= gritUsed;
    }
    if (unmitigated <= 0) {
      result.msg = 'You managed to avoid damage through your grit.';
      return result;
    }
  }
  // Direct Damage taken at this point.
  const dd = unmitigated;
  const currentAttr = character.dice[dmgType];
  if (currentAttr === 0) {
    result.msg = ENDGAME[dmgType].msg;
    result.statuses = new Set(character.statuses);
    result.statuses.delete(status.INCAPACITATED);
    result.statuses.add(ENDGAME[dmgType].status);
    return result;
  }
  let newAttr: DieValue | 0 = currentAttr;
  let ofCount = 0;
  let critCount = 0;
  let saveAgainstDirectDamage = 0;
  let rolledAttr: DieRollSet = [];
  while (unmitigated > 0 && newAttr !== 0) {
    let critical = false;
    if (unmitigated >= newAttr) {
      // Auto crit.
      unmitigated -= newAttr;
      critical = true;
      ofCount++;
    } else {
      console.log(`Damage Save Mod`, character.mod);
      rolledAttr = getModDiceSet(newAttr, character.mod);
      console.log(`Damage Save Dice`, rolledAttr);
      saveAgainstDirectDamage = bestRoll(rolledAttr);
      critical = unmitigated >= saveAgainstDirectDamage;
      unmitigated = 0;
    }
    if (critical) {
      newAttr = stepDown(newAttr);
      critCount++;
    }
    if (!howmuch.overflow) {
      unmitigated = 0;
    }
  }

  if (newAttr !== currentAttr) {
    let ps = '';
    if (newAttr === 0) {
      ps = 'You are now incapacitated.';
      result.statuses = new Set(character.statuses);
      result.statuses.add(status.INCAPACITATED);
    } else {
      ps = `Your ${dmgType.toUpperCase()} d${currentAttr} is now a d${newAttr}.`;
    }
    if (ofCount > 0) {
      if (saveAgainstDirectDamage > 0) {
        const pps = critCount > 2 ? ` (${critCount - 1} times).` : '.';
        const mod = critCount === ofCount ? `avoided` : `took`;
        result.msg = `You took ${dd} direct damage, some of which was automatically critical${pps} You then rolled a ${saveAgainstDirectDamage} and ${mod} more critical damage. ${ps}`;
        result.dice = rolledAttr;
        result.save = saveAgainstDirectDamage;
        result.dd = dd;
      } else {
        const pps = critCount > 1 ? ` ${critCount} times.` : '.';
        result.msg = `You took ${dd} direct damage, which was automatically critical${pps} ${ps}`;
        result.dice = [];
      }
    } else {
      result.msg = `You took ${dd} direct damage, rolled a ${saveAgainstDirectDamage} and have taken critical damage. ${ps}`;
      result.dice = rolledAttr;
      result.save = saveAgainstDirectDamage;
      result.dd = dd;
    }
    result.die = newAttr;
  } else {
    result.msg = `You took ${dd} direct damage but rolled a ${saveAgainstDirectDamage} and avoided critical damage.`;
    result.dice = rolledAttr;
    result.save = saveAgainstDirectDamage;
    result.dd = dd;
  }
  return result;
}