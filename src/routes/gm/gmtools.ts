import { writable, type Subscriber } from "svelte/store";

export function getEventStore<T>() {
  const {set, subscribe} = writable<T | undefined>();
  function emit(value: T) {
    set(value);
    set(undefined);
  }
  function subValue(fn: Subscriber<T>) {
    return subscribe(x => {
      if (x != null) fn(x);
    });
  }
  return { emit, subscribe: subValue };
}

export const rollRequests = getEventStore<{name: string; formula: string;}>();

export const rollResponses = getEventStore<{id: string; result: number;}>();
