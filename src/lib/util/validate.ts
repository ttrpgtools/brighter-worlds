import type { Encounter, Entity, MultiValueOption, NpcStats } from "$lib/types";

const numberlike = /^-?\d+$/;
const formulaic = /^(?:-?\d*d?\d+)(?:\s*\*\s*(?:-?\d*d?\d+))*(?:\s*[+-]\s*(?:-?\d*d?\d+)(?:\s*\*\s*(?:-?\d*d?\d+))*)*$/;
const simpleformula = /^1?d\d+$/;

export function isNumeric(potential: string) {
  return numberlike.test(potential);
}

export function isRollFormula(potential: string) {
  return formulaic.test(potential);
}

export function isSimpleRollFormula(potential: string) {
  return simpleformula.test(potential);
}

export function hasTrigger(potential: unknown): potential is MultiValueOption {
  return (typeof potential === 'object' && potential != null && 'trigger' in potential && 
    (typeof potential.trigger === 'number' ||
      (Array.isArray(potential.trigger) && potential.trigger.length === 2
        && typeof potential.trigger[0] === 'number' && typeof potential.trigger[1] === 'number')));
}

export function isNpc(entity: Entity): entity is NpcStats {
  return 'attacks' in entity;
}

export function isEncounter(entity: Entity): entity is Encounter {
  return 'npcs' in entity;
}

export function isElement(potential: unknown): potential is Element {
  return (typeof potential === 'object' && potential != null && 'tagName' in potential);
}