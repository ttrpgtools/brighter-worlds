import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];

  onmessage: ((ev: MessageEvent<unknown>) => void) | null = null;
  posted: unknown[] = [];
  closed = false;

  constructor(public name: string) {
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(value: unknown) {
    this.posted.push(value);
  }

  close() {
    this.closed = true;
  }
}

describe('createBroadcastStore', () => {
  beforeEach(() => {
    MockBroadcastChannel.instances = [];
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens and closes the broadcast channel with subscriptions', async () => {
    const { createBroadcastStore } = await import('./broadcast-store');
    const store = createBroadcastStore('test-channel', 0);

    expect(MockBroadcastChannel.instances).toHaveLength(0);

    const unsubscribe = store.subscribe(() => {});

    expect(MockBroadcastChannel.instances).toHaveLength(1);
    expect(MockBroadcastChannel.instances[0].name).toBe('test-channel');

    unsubscribe();

    expect(MockBroadcastChannel.instances[0].closed).toBe(true);
  });

  it('accepts falsy broadcast payloads', async () => {
    const { createBroadcastStore } = await import('./broadcast-store');
    const store = createBroadcastStore<number | false | ''>('test-channel', 1);
    const values: Array<number | false | ''> = [];

    const unsubscribe = store.subscribe((value) => values.push(value));
    const channel = MockBroadcastChannel.instances[0];

    channel.onmessage?.({ data: false } as MessageEvent<false>);
    channel.onmessage?.({ data: 0 } as MessageEvent<number>);
    channel.onmessage?.({ data: '' } as MessageEvent<''>);

    expect(values).toEqual([1, false, 0, '']);

    unsubscribe();
  });

  it('posts set and update values while subscribed', async () => {
    const { createBroadcastStore } = await import('./broadcast-store');
    const store = createBroadcastStore<number | false>('test-channel');
    const unsubscribe = store.subscribe(() => {});
    const channel = MockBroadcastChannel.instances[0];

    await store.set(false);
    await store.update(() => 0);

    expect(channel.posted).toEqual([false, 0]);

    unsubscribe();
  });
});
