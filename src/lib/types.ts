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
}

export interface Ability extends UsableEntity {
  details?: string;
  core: boolean;
}

export interface Character {
  name: string;
  pronouns: string;
  grit: Attribute;
  str: Attribute<DieValue, 0>;
  dex: Attribute<DieValue, 0>;
  wil: Attribute<DieValue, 0>;
  statuses: Set<string>;
  xp: number;
  equipment: Item[];
  calling: Entity;
  abilities: Ability[];
  eulogy: string;
  spells: UsableEntity[];
  rituals: UsableEntity[];
  notes?: string;
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
}