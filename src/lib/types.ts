import type { status } from "./const";

export type DieValue = 4 | 6 | 8 | 10 | 12;

export type Attr = 'str' | 'dex' | 'wil';

export interface Attribute<T = number, T2 = T> {
  current: T | T2;
  max: T;
}

export type Identifiable = { id: string };

export interface Entity {
  id: string;
  name: string;
  desc?: string;
}

export interface UsableEntity extends Entity {
  damage?: DieValue;
  extra?: DieValue;
  blast?: boolean;
}

export type MagicType = 'spell' | 'ritual';

export interface Item extends UsableEntity {
  bulky: boolean;
  armor?: number;
  enableMagic?: boolean | { type: MagicType | 'all', count?: number }
}

export interface Ritual extends UsableEntity {
  type: 'ritual';
}

export interface Spell extends UsableEntity {
  type: 'spell';
}

export type Magic = Spell | Ritual;

export type AbilityType = 'core' | 'advanced';

export interface Ability extends UsableEntity {
  details?: string;
  type: AbilityType;
}

export interface EulogyStanza {
  id: string;
  message: string;
  xp: boolean;
  spent: boolean;
}

export interface Character {
  id: string;
  name: string;
  pronouns: string;
  grit: Attribute;
  str: Attribute<DieValue, 0>;
  dex: Attribute<DieValue, 0>;
  wil: Attribute<DieValue, 0>;
  statuses: Set<string>;
  equipment: Item[];
  calling: Entity;
  abilities: Ability[];
  eulogy: EulogyStanza[];
  spells: Spell[];
  rituals: Ritual[];
  notes?: string;
}
export interface CharacterSummary {
  id: string;
  name: string;
  calling: string;
  str: DieValue;
  dex: DieValue;
  wil: DieValue;
}

export interface NpcStats {
  name: string;
  grit: number;
  str: DieValue;
  dex: DieValue;
  wil: DieValue;
  armor?: number;
  attacks: UsableEntity[],
  notes: string[],
  wants?: string,
  found?: string,
}

export interface Calling extends Entity {
  tagline: string;
  for: string;
  equipment: Item[];
  abilities: Ability[];
  info: string;
}

export interface DamageForm {
  damage: string;
  bypassGrit: boolean;
  bypassArmor: boolean;
  overflow: boolean;
}

export type Status = typeof status[keyof typeof status]

export interface DamageDetails {
  armor: number;
  grit: number;
  type: Attr;
  die: DieValue | 0;
  statuses: Set<string>;
}

export interface DamageResults {
  msg: string;
  dice: DieValue[];
  grit?: number;
  die?: DieValue | 0;
  statuses?: Set<string>;
}
