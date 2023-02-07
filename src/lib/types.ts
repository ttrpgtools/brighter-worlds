export type DieValue = 4 | 6 | 8 | 10 | 12;

export interface Attribute<T = number, T2 = T> {
  current: T | T2;
  max: T;
}

export interface Entity {
  name: string;
  desc?: string;
}

export interface UsableEntity extends Entity {
  damage?: DieValue;
  extra?: DieValue;
  blast?: boolean;
}

export interface Item extends UsableEntity {
  bulky: boolean;
  armor?: number;
  enableMagic?: boolean | { type: 'spells' | 'rituals' | 'all', count?: number }
}

export type AbilityType = 'core' | 'advanced';

export interface Ability extends UsableEntity {
  details?: string;
  type: AbilityType;
}

export interface EulogyStanza {
  message: string;
  xp: number;
  spent: number;
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
  spells: UsableEntity[];
  rituals: UsableEntity[];
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
  equipment: UsableEntity[];
  abilities: Ability[];
  info: string;
}
