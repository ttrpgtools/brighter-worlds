export const status = {
  CATATONIC: 'catatonic',
  DEAD: 'dead',
  DEPRIVED: 'deprived',
  INCAPACITATED: 'incapacitated',
  PARALYSED: 'paralysed',
} as const;

export const KNOWN_STATUSES = new Set<string>(Object.values(status));

export const COLOR_SCENE = 2463422;
export const COLOR_ITEM = 16765698;
export const COLOR_ROLL = 11032055;