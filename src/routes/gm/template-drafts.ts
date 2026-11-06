import type { Encounter, NpcStats, UsableEntity } from '$lib/types';
import { id } from '$lib/rolling/id';
import { getEmptyEncounter } from '$lib/data/encounter-manager';
import { cloneEditorDraft, isOptionalImage } from '$lib/util/gm-editor-validation';

export function newNpcDraft(): NpcStats {
  return { id: id(), name: '', notes: [], str: 4, dex: 4, wil: 4, grit: 3, armor: 0, attacks: [] };
}

export function newEncounterDraft(): Encounter {
  return getEmptyEncounter();
}

export function validDamage(value: UsableEntity['damage']) {
  return (
    value === undefined ||
    (Array.isArray(value) ? value.length > 0 && value.every(validDie) : validDie(value))
  );
}

export function validDie(value: unknown) {
  return [4, 6, 8, 10, 12].includes(value as number);
}

export function npcFieldErrors(npc: NpcStats) {
  const errors: Record<string, string[]> = {
    name: [],
    str: [],
    dex: [],
    wil: [],
    grit: [],
    armor: [],
    image: [],
    attacks: [],
  };
  if (!npc.name.trim()) errors.name.push('Name: enter an NPC name.');
  for (const attr of ['str', 'dex', 'wil'] as const) {
    if (!validDie(npc[attr]))
      errors[attr].push(`${attr.toUpperCase()}: choose d4, d6, d8, d10 or d12.`);
  }
  if (!Number.isSafeInteger(npc.grit) || npc.grit < 0)
    errors.grit.push('Grit: enter a whole number of zero or more.');
  if (npc.armor != null && (!Number.isSafeInteger(npc.armor) || npc.armor < 0))
    errors.armor.push('Armor: enter a whole number of zero or more.');
  if (!isOptionalImage(npc.image))
    errors.image.push('Image: enter a supported image URL or path, or leave it empty.');
  npc.attacks.forEach((attack, index) => {
    if (!attack.name.trim()) errors.attacks.push(`Attack ${index + 1}: enter a name.`);
    if (!validDamage(attack.damage))
      errors.attacks.push(`Attack ${index + 1}: choose valid damage dice.`);
  });
  return errors;
}

export function npcErrors(npc: NpcStats) {
  return Object.values(npcFieldErrors(npc)).flat();
}

export function saveNpcDraft(draft: NpcStats) {
  if (npcErrors(draft).length) throw new Error('Correct the NPC fields before saving.');
  const npc = cloneEditorDraft(draft);
  npc.name = npc.name.trim();
  return npc;
}

export function saveEncounterDraft(draft: Encounter) {
  if (!draft.name.trim()) throw new Error('Name: enter an encounter name.');
  if (draft.npcs.some((npc) => npcErrors(npc).length))
    throw new Error('Correct the NPC fields before saving.');
  const encounter = cloneEditorDraft(draft);
  encounter.name = encounter.name.trim();
  return encounter;
}
