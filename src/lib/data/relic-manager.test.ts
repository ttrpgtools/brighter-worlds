import { expect, it } from 'vitest';
import { relicManager } from './relic-manager';
import { newCharacter } from './account-creation';
import { encodeSheet, ExportContext } from './sheet-format/codec';

it('keeps all six masterworks and their collection rule in portable character equipment', async () => {
  const ids = [
    'clutches-of-chosen-kinship',
    'grapple-of-forced-perspective',
    'gourd-of-pleasant-fullness',
    'hammer-of-vigorous-obstinacy',
    'torch-of-mischievous-light',
    'sword-of-cutting-judgment',
  ];
  const equipment = ids.map((id) => structuredClone(relicManager.getById(`relic-${id}`)!));
  expect(equipment).not.toContain(undefined);
  const { document } = await encodeSheet(
    newCharacter({ equipment }, 'masterworks-test'),
    new ExportContext(null),
  );
  for (const item of document.character.equipment) {
    expect(item.desc).toContain('Personality:');
    expect(item.desc).toContain('Legacy of an Unknown Craftswoman');
    expect(item.desc).toContain('all six in one place');
    expect(item.desc).toContain('one final commission');
  }
  expect(document.character.equipment.at(-1)?.damage).toBe(8);
  expect(relicManager.getAll()).toHaveLength(17);
  expect(relicManager.getById('relic-06')?.desc).toContain('Wounds ignite');
  expect(relicManager.getById('relic-00')?.desc).not.toContain('Craftswoman');
});
