
type Die = 4 | 6 | 8 | 10 | 12;

interface Attribute<T = number> {
  current: T;
  max: T;
}

interface Entity {
  name: string;
  desc: string;
}

interface UsableEntity extends Entity {
  damage?: Die;
}

interface Item extends UsableEntity {
  bulky: boolean;
}

export interface Character {
  name: string;
  pronouns: string;
  grit: Attribute;
  str: Attribute<Die>;
  dex: Attribute<Die>;
  wil: Attribute<Die>;
  statuses: Set<string>;
  xp: number;
  equipment: Item[];
  calling: Entity;
  abilities: UsableEntity[];
  eulogy: string;
  spells: UsableEntity[];
  rituals: UsableEntity[];
  notes: string;
}
