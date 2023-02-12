export const status = {
  CATATONIC: 'catatonic',
  DEAD: 'dead',
  DEPRIVED: 'deprived',
  INCAPACITATED: 'incapacitated',
  PARALYSED: 'paralysed',
} as const;

export const KNOWN_STATUSES = new Set<string>(Object.values(status));
