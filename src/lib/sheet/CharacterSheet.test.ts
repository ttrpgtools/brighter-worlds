import { beforeEach, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { get, writable } from 'svelte/store';
import type { DieValue } from '$lib/types';
import type { AccountSession } from '$lib/data/account-session';
import { getEmptySheet } from '$lib/data/sheet-manager';
import { getEnhanced, getImpaired } from '$lib/rolling/modifier';
import CharacterSheet from './CharacterSheet.svelte';

// Keep the real sheet/controller callbacks, substituting passive child views for SSR.
const view = vi.hoisted(() => ({
  props: {} as Record<string, any>,
  session: undefined as unknown as AccountSession,
  controller: undefined as any,
  empty: () => {},
  capture: (name: string) => (_renderer: unknown, props: unknown) => {
    view.props[name] = props;
  },
  broadcastRoll: vi.fn(),
  sendToDiscord: vi.fn(),
}));
vi.mock('$lib/data/account-session', async (original) => ({
  ...(await original<object>()),
  getAccountSession: () => view.session,
}));
vi.mock('$lib/data/account-persistence', () => ({ createAccountSheet: () => view.controller }));
vi.mock('$lib/data/sheet-manager', async (original) => ({
  ...(await original<object>()),
  getList: () => writable([]),
  getSheetCache: () => writable([]),
  loadSheet: () => view.controller.sheet,
  tryMigrate: () => Promise.resolve(),
}));
vi.mock('$lib/data/channel-child', () => ({ broadcastRoll: view.broadcastRoll }));
vi.mock('$lib/util/discord', () => ({ sendToDiscord: view.sendToDiscord }));
vi.mock('$lib/rolling/roll', () => ({ bestRoll: () => 4 }));
vi.mock('$lib/DiceDialog.svelte', () => ({ default: view.empty }));
vi.mock('$lib/ChoiceDialog.svelte', () => ({ default: view.empty }));
vi.mock('$lib/SheetRecovery.svelte', () => ({ default: view.empty }));
vi.mock('$lib/SheetSyncStatus.svelte', () => ({ default: view.empty }));
vi.mock('$lib/LocalSheetStorage.svelte', () => ({ default: view.empty }));
vi.mock('./DamageDialog.svelte', () => ({ default: view.empty }));
vi.mock('./SheetSettings.svelte', () => ({ default: view.capture('settings') }));
vi.mock('./Roller.svelte', () => ({ default: view.capture('roller') }));
vi.mock('./Calling.svelte', () => ({ default: view.capture('calling') }));
vi.mock('./Name.svelte', () => ({ default: view.empty }));
vi.mock('./Grit.svelte', () => ({ default: view.empty }));
vi.mock('./Attribute.svelte', () => ({ default: view.empty }));
vi.mock('./Equipment.svelte', () => ({ default: view.empty }));
vi.mock('./Magic.svelte', () => ({ default: view.empty }));
vi.mock('./Statuses.svelte', () => ({ default: view.empty }));
vi.mock('./EulogyNotes.svelte', () => ({ default: view.empty }));

let identity: ReturnType<typeof writable<{ epoch: number; owner: string | null }>>;
beforeEach(() => {
  vi.clearAllMocks();
  view.props = {};
  identity = writable({ epoch: 1, owner: 'A' });
  const current = () => {
    const value = get(identity);
    return {
      epoch: value.epoch,
      account: value.owner ? { user: { id: value.owner } } : null,
    } as ReturnType<AccountSession['current']>;
  };
  view.session = {
    current,
    subscribe: (run) => identity.subscribe(() => run(current())),
    refresh: async () => {},
  };
  const hero = getEmptySheet();
  // Remove the empty marker, as a loaded sheet would.
  for (const key of Object.getOwnPropertySymbols(hero)) delete (hero as any)[key];
  hero.name = 'Mara';
  hero.settings = { rollToBridge: true, rollToDiscord: true, discordWebhook: 'private-hook' };
  view.controller = {
    sheet: Object.assign(writable(hero), { loaded: Promise.resolve() }),
    loaded: Promise.resolve(),
    status: {
      subscribe: (run: (value: { accessible: boolean }) => void) =>
        identity.subscribe((value) => run({ accessible: value.owner === 'A' })),
    },
  };
});
function open(owner: string | null = 'A') {
  const result = render(CharacterSheet, {
    props: { data: { id: 'hero', owner, callings: [], enhancements: [] } },
  });
  void result.body;
  return result;
}

it.each([{ dice: [8] as DieValue[] }, { dice: getEnhanced(8) }, { dice: getImpaired() }])(
  'routes Calling dice %j with the ability label and sharing preferences',
  async ({ dice }) => {
    open();
    expect(view.props.calling.onroll).toBeTypeOf('function');
    await view.props.calling.onroll({ dice, name: 'Ability damage' });
    expect(view.broadcastRoll).toHaveBeenCalledWith('Mara', 4, 'Ability damage', dice, 'Mara');
    expect(view.sendToDiscord).toHaveBeenCalledWith(
      'Mara',
      4,
      'Ability damage',
      'private-hook',
      dice,
      'Mara',
    );
    view.broadcastRoll.mockClear();
    view.sendToDiscord.mockClear();
    view.controller.sheet.update((hero: any) => ({
      ...hero,
      settings: { rollToBridge: false, rollToDiscord: false },
    }));
    open();
    await view.props.calling.onroll({ dice, name: 'Ability damage' });
    expect(view.broadcastRoll).not.toHaveBeenCalled();
    expect(view.sendToDiscord).not.toHaveBeenCalled();
  },
);

it.each(['B', null])(
  'removes private controls and blocks retained callbacks after switching to %s',
  async (owner) => {
    open();
    const roller = view.props.roller.onroll;
    const calling = view.props.calling.onroll;
    expect(view.props.settings.settings.discordWebhook).toBe('private-hook');
    identity.set({ epoch: 2, owner });
    view.props = {};
    const locked = open();
    expect(locked.body).toContain('Sign in to this sheet');
    expect(locked.body).not.toContain('Mara');
    expect(view.props.settings).toBeUndefined();
    expect(view.props.roller).toBeUndefined();
    await roller(8);
    await calling({ dice: [8], name: 'Old ability' });
    expect(view.broadcastRoll).not.toHaveBeenCalled();
    expect(view.sendToDiscord).not.toHaveBeenCalled();
  },
);

it('keeps local sheet controls available while signed out', () => {
  identity.set({ epoch: 2, owner: null });
  open(null);
  expect(view.props.settings).toBeDefined();
  expect(view.props.roller).toBeDefined();
});
