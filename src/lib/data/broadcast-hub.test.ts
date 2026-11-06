import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
vi.mock('$app/environment', () => ({ browser: true }));

class Channel {
  static open = new Set<Channel>();
  onmessage: ((event: { data: unknown }) => void) | undefined;
  constructor(public name: string) {
    Channel.open.add(this);
  }
  postMessage(data: unknown) {
    for (const other of Channel.open) {
      if (other !== this && other.name === this.name) other.onmessage?.({ data });
    }
  }
  close() {
    Channel.open.delete(this);
  }
}
beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', Channel);
});
afterEach(() => {
  Channel.open.clear();
  vi.unstubAllGlobals();
});

it('discovers a sheet registered first in this tab, with multiple pickers and repeat checks', async () => {
  const { registerForRollCall, requestRollCall, rerequest } = await import('./broadcast-hub');
  const leave = registerForRollCall((here) => here('hero', 'Hero'));
  const first = requestRollCall();
  const second = requestRollCall();
  let a = new Map();
  let b = new Map();
  const stopA = first.subscribe((value) => {
    a = value;
  });
  const stopB = second.subscribe((value) => {
    b = value;
  });
  expect(a.get('hero')).toEqual({ name: 'Hero', count: 1 });
  expect(b.get('hero')).toEqual({ name: 'Hero', count: 1 });
  rerequest();
  rerequest();
  expect(a.get('hero').count).toBe(1);
  expect(b.get('hero').count).toBe(1);
  stopA();
  leave();
  expect(b.size).toBe(0);
  stopB();
  expect(Channel.open.size).toBe(0);
});

it('keeps a character available until its last sheet tab leaves', async () => {
  const { registerForRollCall, requestRollCall } = await import('./broadcast-hub');
  const picker = requestRollCall();
  const stop = picker.subscribe(() => {});
  const first = registerForRollCall((here) => here('hero', 'Hero'));
  const second = registerForRollCall((here) => here('hero', 'Renamed'));
  expect(get(picker).get('hero')).toEqual({ name: 'Renamed', count: 2 });
  first();
  expect(get(picker).get('hero')?.count).toBe(1);
  second();
  stop();
  expect(Channel.open.size).toBe(0);
});

it('ignores delayed loading callbacks after a sheet closes and tolerates unavailable channels', async () => {
  const { registerForRollCall, requestRollCall } = await import('./broadcast-hub');
  let ready: (id: string, name: string) => void = () => {};
  const leave = registerForRollCall((here) => {
    ready = here;
  });
  leave();
  ready('late', 'Late');
  expect(Channel.open.size).toBe(0);
  vi.stubGlobal('BroadcastChannel', undefined);
  expect(get(requestRollCall()).size).toBe(0);
  registerForRollCall(() => {})();
});

it('still accepts presence from older sheet tabs without instance IDs', async () => {
  const { requestRollCall } = await import('./broadcast-hub');
  const picker = requestRollCall();
  const stop = picker.subscribe(() => {});
  const legacy = new BroadcastChannel('bwo-roll-call');
  legacy.postMessage({ type: 'here', id: 'old', name: 'Old' });
  expect(get(picker).get('old')?.count).toBe(1);
  legacy.postMessage({ type: 'bye', id: 'old', name: 'Old' });
  expect(get(picker).size).toBe(0);
  stop();
  legacy.close();
});
