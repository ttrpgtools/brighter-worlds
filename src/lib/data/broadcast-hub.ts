import { browser } from '$app/environment';
import { readable } from 'svelte/store';

type RollCallback = (here: (id: string, name: string) => void) => void;
type Characters = Map<string, { name: string; count: number }>;
interface Presence {
  type: 'here' | 'bye';
  id: string;
  name: string;
  instance?: string;
  request?: string;
}
type Message = Presence | { type: 'request'; request?: string };
const CHANNEL = 'bwo-roll-call';
const refreshers = new Set<() => void>();

/** Each picker owns its subscription, including when a sheet is already open in this tab. */
export function requestRollCall() {
  return readable<Characters>(new Map(), (set) => {
    if (!browser || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL);
    const instances = new Map<string, Map<string, string>>();
    let request: string;
    let legacySequence = 0;
    const publish = () => {
      set(
        new Map(
          [...instances].map(([id, tabs]) => [
            id,
            {
              name: [...tabs.values()].at(-1) ?? '',
              count: tabs.size,
            },
          ]),
        ),
      );
    };
    channel.onmessage = ({ data }: MessageEvent<Message>) => {
      if (!data || (data.type !== 'here' && data.type !== 'bye')) return;
      if (data.request && data.request !== request) return;
      if (typeof data.id !== 'string' || typeof data.name !== 'string' || !data.id || !data.name)
        return;
      const tabs = instances.get(data.id) ?? new Map<string, string>();
      if (data.type === 'here') {
        // Older open sheets lack instance IDs; keep their existing count-based protocol working.
        tabs.set(data.instance ?? `legacy-${++legacySequence}`, data.name);
        instances.set(data.id, tabs);
      } else {
        tabs.delete(data.instance ?? tabs.keys().next().value ?? '');
        if (!tabs.size) instances.delete(data.id);
      }
      publish();
    };
    const refresh = () => {
      instances.clear();
      publish();
      request = crypto.randomUUID();
      channel.postMessage({ type: 'request', request });
    };
    refreshers.add(refresh);
    refresh();
    return () => {
      refreshers.delete(refresh);
      channel.close();
    };
  });
}

export function rerequest() {
  refreshers.forEach((refresh) => refresh());
}

/** Keep discovery independent from event-sharing preferences and retireable external transports. */
export function registerForRollCall(fn: RollCallback) {
  if (!browser || typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(CHANNEL);
  const instance = crypto.randomUUID();
  let closed = false;
  let last: { id: string; name: string } | undefined;
  function announce(request?: string) {
    fn((id, name) => {
      // Sheet loading can finish after this component was unmounted.
      if (closed || !id || !name) return;
      last = { id, name };
      channel.postMessage({ type: 'here', id, name, instance, request });
    });
  }
  channel.onmessage = ({ data }: MessageEvent<Message>) => {
    if (data?.type === 'request') announce(data.request);
  };
  announce();
  return () => {
    if (closed) return;
    closed = true;
    if (last) channel.postMessage({ type: 'bye', ...last, instance });
    channel.close();
  };
}
