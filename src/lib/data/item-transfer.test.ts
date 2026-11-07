import { afterEach, expect, it, vi } from 'vitest';
import { get, writable } from 'svelte/store';
import { receiveItem, readSharedItem } from './item-transfer';
import { formatItem } from '$lib/util/share';
import { sendItemToDiscord, sendMagicToDiscord, sendToDiscord } from '$lib/util/discord';
import { encode } from '$lib/util/b64';
import { normalizeLegacySheet } from './legacy-sheet';
import legacy from './sheet-format/fixtures/legacy-root.json';
import type { AsyncWritable } from './async-load-store';
import type { Character, Item } from '$lib/types';

const item: Item = {
  id: 'lantern',
  name: 'Lanterne étoilée 🔥',
  quantity: 2,
  bulky: true,
  damage: [4, 6],
};
function windowAt(origin: string) {
  vi.stubGlobal('window', { location: { href: `${origin}/gm` }, btoa, atob });
}
afterEach(() => {
  vi.unstubAllGlobals();
});

it.each(['https://brighterworlds.app', 'https://dev.brighterworlds.app'])(
  'keeps Discord item URLs usable at %s',
  async (origin) => {
    windowAt(origin);
    const fetch = vi.fn().mockResolvedValue({ status: 204 });
    vi.stubGlobal('fetch', fetch);
    await sendItemToDiscord(item, 'https://discord.com/api/webhooks/test');
    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    const url = new URL(payload.embeds[0].url);
    expect(url.origin).toBe(origin);
    expect(url.pathname).toBe('/character/obtain');
    expect(readSharedItem(url.searchParams.get('item')!)).toEqual(item);
    expect(payload.allowed_mentions.parse).toEqual([]);
    expect(payload.embeds[0].fields).toContainEqual({ name: 'Quantity', value: '2' });
    expect(formatItem(item).title).toBe(item.name);
  },
);

it('keeps roll and magic Discord adapters with expected embeds', async () => {
  const fetch = vi.fn().mockResolvedValue({ status: 204 });
  vi.stubGlobal('fetch', fetch);
  await sendToDiscord('Hero', 5, 'WIL', 'https://discord.com/api/webhooks/test', [6], 'Hero');
  await sendMagicToDiscord(
    { id: 'spark', name: 'Spark', type: 'spell' },
    'https://discord.com/api/webhooks/test',
    'Hero',
  );
  const [roll, magic] = fetch.mock.calls.map(([, init]) => JSON.parse(init.body));
  expect(roll.embeds[0].fields[0]).toEqual({ name: '5', value: 'd6', inline: true });
  expect(magic.embeds[0].title).toBe('Spark');
  expect(magic.username).toBe('Hero');
});

it('rejects broken or invalid inventory links before touching a sheet', () => {
  windowAt('https://brighterworlds.app');
  for (const value of [
    '!',
    encode('{'),
    encode('{"name":"Bad","quantity":-2}'),
    encode('{"name":"Bad","damage":999}'),
    encode('{"name":"Bad","image":{}}'),
  ]) {
    expect(() => readSharedItem(value)).toThrow();
  }
});

function sheet() {
  const store = writable(normalizeLegacySheet(legacy));
  const update = vi.fn(async (fn) => {
    store.update(fn);
  });
  return {
    ...store,
    loaded: Promise.resolve(),
    update,
    set: async (value) => {
      store.set(value);
    },
  } as AsyncWritable<Character>;
}
it('adds and stacks inventory without mutating the shared payload or an old snapshot', async () => {
  const chosen = sheet();
  const before = get(chosen);
  await receiveItem(chosen, item);
  await receiveItem(chosen, item);
  expect(get(chosen).equipment.find((entry) => entry.name === item.name)?.quantity).toBe(4);
  expect(before.equipment.find((entry) => entry.name === item.name)).toBeUndefined();
  expect(item.quantity).toBe(2);
});

it('does not report receipt until the save completes, and propagates a storage failure', async () => {
  const chosen = sheet();
  let fail: (error: Error) => void = () => {};
  chosen.update = () =>
    new Promise((_resolve, reject) => {
      fail = reject;
    });
  let finished = false;
  const operation = receiveItem(chosen, item);
  const result = operation.then(
    () => {
      finished = true;
    },
    (error) => error,
  );
  await Promise.resolve();
  expect(finished).toBe(false);
  fail(new Error('quota'));
  expect(await result).toEqual(new Error('quota'));
});
