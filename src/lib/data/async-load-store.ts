import type { Updater, Writable } from "svelte/store";

export interface AsyncWritable<T> extends Writable<T> {
  set: (value: T) => Promise<void>;
  update: (fn: Updater<T>) => Promise<void>;
}

export function createAsyncStore<T>(internal: Writable<T>, load: Promise<T>): AsyncWritable<T> {
  const loaded = load.then(value => {
    if (value != null) {
      internal.set(value);
    }
  });

  async function set(value: T) {
    await loaded;
    internal.set(value);
  }

  async function update(fn: Updater<T>) {
    await loaded;
    internal.update(fn);
  }

  return {
    ...internal,
    update,
    set,
  }
}