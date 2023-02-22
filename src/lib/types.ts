import type { status } from "./const";

export type DieValue = 4 | 6 | 8 | 10 | 12;

export type Attr = 'str' | 'dex' | 'wil';

export interface Attribute<T = number, T2 = T> {
  current: T | T2;
  max: T;
}

export type Identifiable = { id: string };
export type Named = { name: string };

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
  fragile?: boolean;
  enableMagic?: boolean | { type: MagicType | 'all', count?: number }
}

export interface Ritual extends UsableEntity {
  type: 'ritual';
}

export interface Spell extends UsableEntity {
  type: 'spell';
}

export type Magic = Spell | Ritual;

export type AbilityType = 'core' | 'advanced' | 'companion' | 'enhance';

export interface Ability extends UsableEntity {
  details?: string;
  type: AbilityType;
}

export interface EquipmentChoice {
  choose: 'equipment';
  type: Attr;
  die: DieValue;
}

export interface MagicChoice {
  choose: 'magic';
  type: MagicType;
  random: boolean;
}

export interface LinkedSheetChoice {
  choose: 'linked';
  name: string;
  id: string;
}

export interface EnhancementChoice {
  choose: 'enhancement';
  table: string;
}

export type CharacterChoice = EquipmentChoice | MagicChoice | LinkedSheetChoice | EnhancementChoice;

export interface HasChoices {
  choices?: CharacterChoice[];
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

export interface Attrs { str: DieValue; dex: DieValue; wil: DieValue; };

export interface CharacterSummary extends Attrs {
  id: string;
  name: string;
  calling: string;
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

export interface Calling extends Entity, HasChoices {
  tagline: string;
  for: string;
  equipment: Item[];
  abilities: (Ability & HasChoices)[];
  spells?: string[];
  rituals?: string[];
  info: string;
  hidden?: boolean;
  grit?: number;
  attrs?: Attrs;
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

export type RemoteMessageType = 'roll' | 'intro';

export interface BaseRemoteMessage {
  id: string;
  name: string;
}

export interface RemoteRollMessage extends BaseRemoteMessage {
  type: 'roll';
  dice: DieValue[];
  result: number;
  label?: string;
}

export interface RemoteTextMessage extends BaseRemoteMessage {
  type: 'text';
  message: string;
}

export type RemoteMessage = RemoteRollMessage | RemoteTextMessage;


export type HandlerFn = (msg: RemoteMessage) => void;

export interface TableRoll<T> {
  roll: number;
  value: T;
}

export interface StartingGearOptions {
  name: string;
  flair: string[];
  items: Item[];
}

export interface StartingGear {
  str: StartingGearOptions;
  dex: StartingGearOptions;
  wil: StartingGearOptions;
}

export interface CallingEnhancements extends Entity {
  type: string;
  options: {name: string; desc: string}[];
}

export interface CallingEnhancement {
  name: string;
  desc: string;
  type: string;
}
