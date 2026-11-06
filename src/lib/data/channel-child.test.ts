import { afterEach, expect, it, vi } from 'vitest';
import { decode } from '$lib/util/b64';
vi.mock('$app/environment', () => ({ browser: true }));

class Channel {
  static latest: Channel;
  posted: unknown[] = [];
  onmessage: ((event: { data: unknown }) => void) | undefined;
  constructor(public name: string) {
    Channel.latest = this;
  }
  postMessage(message: unknown) {
    this.posted.push(message);
  }
  close() {}
}
afterEach(() => {
  vi.unstubAllGlobals();
});

it('retains local roll/item/magic/NPC/scene events and receives events without echoing them', async () => {
  vi.stubGlobal('BroadcastChannel', Channel);
  vi.stubGlobal('window', {
    location: { href: 'https://brighterworlds.app/character/hero' },
    btoa,
    atob,
  });
  const { broadcast, broadcastRoll, broadcastItem, broadcastMagic, broadcastNpc, broadcastScene } =
    await import('./channel-child');
  const seen: unknown[] = [];
  const stop = broadcast.subscribe((message) => seen.push(message));
  broadcastRoll('Hero', 4, 'STR', [6], 'Hero');
  await broadcastItem({ id: 'sword', name: 'Sword', damage: 6 });
  await broadcastMagic({ id: 'spark', name: 'Spark', type: 'spell' });
  await broadcastNpc({ id: 'npc', name: 'Guide' });
  await broadcastScene({ id: 'scene', name: 'Forest', desc: 'Green' });
  const channel = Channel.latest;
  expect(channel.name).toBe('bwo-roll-channel');
  expect(channel.posted).toHaveLength(5);
  expect(new Set(channel.posted.map((message: any) => message.id)).size).toBe(5);
  const item = channel.posted[1] as any;
  expect(JSON.parse(decode(new URL(item.embed.url).searchParams.get('item')!)).name).toBe('Sword');
  const remote = {
    id: 'remote',
    type: 'embed',
    name: 'Other',
    embed: { title: 'Received', fields: [] },
  };
  channel.onmessage?.({ data: remote });
  expect(seen.at(-1)).toEqual(remote);
  expect(channel.posted).toHaveLength(5);
  stop();
});
