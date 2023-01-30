
export type DieValue = 4 | 6 | 8 | 10 | 12;

export interface Attribute<T = number> {
  current: T;
  max: T;
}

export interface Entity {
  name: string;
  desc?: string;
}

export interface UsableEntity extends Entity {
  damage?: DieValue;
}

export interface Item extends UsableEntity {
  bulky: boolean;
  armor?: number;
}

export interface Character {
  name: string;
  pronouns: string;
  grit: Attribute;
  str: Attribute<DieValue>;
  dex: Attribute<DieValue>;
  wil: Attribute<DieValue>;
  statuses: Set<string>;
  xp: number;
  equipment: Item[];
  calling: Entity;
  abilities: UsableEntity[];
  eulogy: string;
  spells: UsableEntity[];
  rituals: UsableEntity[];
  notes?: string;
}
