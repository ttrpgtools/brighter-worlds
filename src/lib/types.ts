import type { status } from "./const";

export const EMPTY: unique symbol = Symbol();

function hasEmptySymbol(obj: unknown): obj is {[EMPTY]: boolean}  {
  return Object.getOwnPropertySymbols(obj).some(s => s === EMPTY);
}

export function isEmpty(obj: unknown) {
  return hasEmptySymbol(obj) ? obj[EMPTY] : false;
}

export function setEmpty(obj: unknown, value: boolean) {
  if (hasEmptySymbol(obj)) {
    obj[EMPTY] = value;
    return true;
  }
  return false;
}

export type DieValue = 4 | 6 | 8 | 10 | 12;

export type DieMod = 'impair' | 'enhance';

export type DieRollSet = DieValue[] & {mod?: DieMod};

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
  image?: string | Blob;
  icon?: string;
}

export interface UsableEntity extends Entity {
  damage?: DieValue | DieValue[];
  blast?: boolean;
}

export type MagicType = 'spell' | 'ritual';

export interface Item extends UsableEntity {
  bulky?: boolean;
  armor?: number;
  fragile?: boolean;
  quantity?: number;
  quantFormula?: string;
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
  linked?: boolean;
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

export interface SheetSettings {
  [EMPTY]?: boolean | undefined;
  rollToBridge: boolean;
  rollToDiscord: boolean;
  discordWebhook: string;
}

export interface Character {
  [EMPTY]?: boolean | undefined;
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
  settings?: SheetSettings;
  created: number;
  sortkey: number;
}

export interface Attrs { str: DieValue; dex: DieValue; wil: DieValue; };

export interface CharacterSummary extends Attrs {
  id: string;
  name: string;
  calling: string;
  created: number;
  sortkey: number;
}

interface BaseNpc extends Entity {
  armor?: number;
  notes: string[],
  wants?: string,
  found?: string,
}

export interface NpcStats extends BaseNpc, Attrs {
  grit: number;
  attacks: UsableEntity[],
}

export interface NpcInstance extends BaseNpc {
  [EMPTY]?: boolean | undefined;
  grit: Attribute;
  str: Attribute<DieValue, 0>;
  dex: Attribute<DieValue, 0>;
  wil: Attribute<DieValue, 0>;
  status: string;
  attacks: Item[];
  armor: number;
}

export interface Scene extends Entity {
  gmnotes?: string;
}

export interface Encounter extends Entity {
  [EMPTY]?: boolean | undefined;
  npcs: NpcStats[];
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
  type: Attr;
}

export type Status = typeof status[keyof typeof status]

export interface DamageDetails {
  armor: number;
  grit: number;
  mod?: DieMod;
  type?: Attr;
  dice: Record<Attr, DieValue | 0>;
  statuses: Set<string>;
}

export interface DamageResults {
  msg: string;
  dice: DieValue[];
  type: Attr;
  grit?: number;
  die?: DieValue | 0;
  statuses?: Set<string>;
  save?: number;
  dd?: number;
}

export interface MultiValueOption {
  trigger: number | [number, number];
}

interface TextRolltableOption extends MultiValueOption {
  type: 'text';
  value: string;
}

interface EntityRolltableOption extends MultiValueOption {
  type: 'entity';
  value: Entity;
}

export type RolltableOption = TextRolltableOption | EntityRolltableOption;

export interface CustomRolltableDef extends Entity {
  formula: string;
  options: RolltableOption[];
}

export type RemoteMessageType = 'roll' | 'intro';

export interface BaseRemoteMessage {
  id: string;
  name: string;
}

export interface RollResult {
  dice: DieValue[];
  result: number;
  label?: string;
}

export interface LogRoll {
  id: string;
  name: string;
  type: 'roll';
  roll: RollResult;
  time?: Date | number;
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

export interface RemoteEmbedMessage extends BaseRemoteMessage {
  type: 'embed';
  embed: DiscordEmbed;
  time?: Date | number;
}

export interface RemoteCtaReplyMessage extends BaseRemoteMessage {
  type: 'ctareply';
  cta: string;
  time?: Date | number;
}

export type RemoteMessage = RemoteRollMessage | RemoteTextMessage | RemoteEmbedMessage;


export type HandlerFn = (msg: RemoteMessage) => void;

export interface TableRoll<T> {
  roll: number;
  dice?: DieValue[];
  total?: number;
  title?: string;
  value: T[];
}

export interface StartingGearOptions {
  name: string;
  flair: string[];
  items: Item[];
}

export interface StartingGear {
  starting: Item[];
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

export interface BaseCta extends Identifiable {
  label: string;
  meta?: string;
}
export interface RollCta extends BaseCta {
  type: 'roll';
  formula: string;
}

export type Cta = RollCta;

export interface DiscordEmbed {
  title?: string;
  author?: { name: string, icon_url?: string; };
  description?: string;
  url?: string;
  color?: number;
  cta?: Cta[];
  footer?: { text: string; icon_url?: string; }
  image?: { url: string };
  fields: { name: string, value: string, inline?: boolean }[];
  meta?: string;
}
