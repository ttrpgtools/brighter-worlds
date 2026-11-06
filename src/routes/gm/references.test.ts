import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import NpcSheet from './NpcSheet.svelte';
import { npcManager } from '$lib/data/npc-manager';
import type { NpcInstance } from '$lib/types';

it('renders creature traits even without wants or found text', () => {
  const cat = structuredClone(npcManager.getById('beast-half-dead-cat')!);
  const npc: NpcInstance = {
    ...cat,
    status: '',
    armor: cat.armor ?? 0,
    grit: { current: cat.grit, max: cat.grit },
    str: { current: cat.str, max: cat.str },
    dex: { current: cat.dex, max: cat.dex },
    wil: { current: cat.wil, max: cat.wil },
    wants: '',
    found: '',
  };
  const { body } = render(NpcSheet, {
    props: {
      npc,
      onshare() {},
      ondamage() {},
      ondelete() {},
      onroll() {},
    },
  });
  expect(body).toContain('Deals Direct Damage to WIL on odd damage rolls.');
  expect(body).toContain('Half ethereal');
  expect(npcManager.getById('beast-adventurer')?.armor).toBe(1);
  expect(npcManager.getById('beast-screaming-ghost')).toBeDefined();
});
