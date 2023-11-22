
export const status = {
  CATATONIC: 'catatonic',
  DEAD: 'dead',
  DEPRIVED: 'deprived',
  INCAPACITATED: 'incapacitated',
  PARALYSED: 'paralysed',
  UNCONSCIOUS: 'unconscious',
} as const;

export const KNOWN_STATUSES = new Set<string>(Object.values(status));

export const COLOR_SCENE = 2463422;
export const COLOR_ITEM = 16765698;
export const COLOR_ROLL = 11032055;
export const COLOR_NPC = 14423100;
// #f472b6 pink-400
export const COLOR_MAGIC = 16020150;

// #f43f5e rose-500
export const COLOR_DANGER = 16007006;
// #f59e0b amber-500
export const COLOR_WARN = 16096779;
// #10b981 emerald-500
export const COLOR_OK = 1096065;

export const ENCOUNTER_ROLL_YES = 'Encounter';
export const ENCOUNTER_ROLL_SIGNS = 'Signs of an Encounter';
export const ENCOUNTER_ROLL_NO = 'Nothing';

export const REACTION_ROLL_VPOS = 'Extremely positive';
export const REACTION_ROLL_POS = 'Positive';
export const REACTION_ROLL_NEUTRAL = 'Neutral';
export const REACTION_ROLL_NEG = 'Negative';
export const REACTION_ROLL_VNEG = 'Extremely negative';

export const SAVE_GOAL = 4;
