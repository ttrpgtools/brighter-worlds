import { expect, it } from 'vitest';
import { characterEntries, filterCharacters } from './character-library';
import { fromRemote } from './account-persistence';
import fixture from './sheet-format/fixtures/sheet-v1.json';
import type { SheetDocumentV1 } from './sheet-format/types';
it('keeps independent local and account copies distinct while sharing one card model and filters', () => {
  const cached = fromRemote('owner-A', {
    docId: 'hero_01',
    data: structuredClone(fixture) as SheetDocumentV1,
    version: 1,
    meta: null,
    createdAt: 1,
    updatedAt: 1,
  });
  cached.character.name = 'Account draft';
  cached.revision++;
  const rows = characterEntries(
    [
      {
        id: 'hero_01',
        name: 'Local original',
        calling: 'Witch',
        str: 4,
        dex: 6,
        wil: 8,
        created: 1,
        sortkey: 1,
      },
    ],
    'owner-A',
    [],
    [cached],
  );
  expect(rows.map((row) => row.key)).toEqual(['local:hero_01', 'account:owner-A:hero_01']);
  expect(filterCharacters(rows, 'all')).toHaveLength(2);
  expect(filterCharacters(rows, 'local').map((row) => row.name)).toEqual(['Local original']);
  expect(filterCharacters(rows, 'account')[0]).toMatchObject({
    name: 'Account draft',
    storage: 'account',
    attention: true,
    status: 'Changes waiting to save online',
  });
  expect(characterEntries([], '', [], [cached])).toEqual([]);
});
it('does not invent attribute values for online sheets that have not been cached', () => {
  const [row] = characterEntries(
    [],
    'owner-A',
    [
      {
        docId: 'new-sheet',
        meta: { name: 'Online only', calling: 'Cleric', formatVersion: 1, createdAt: 1 },
        version: 2,
        createdAt: 1,
        updatedAt: 2,
      },
    ],
    [],
  );
  expect(row.name).toBe('Online only');
  expect(row.str).toBeUndefined();
  expect(row.cached).toBe(false);
});
