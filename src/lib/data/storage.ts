import { defined } from '$lib/util/array';
import { writable, type Updater, type Writable } from 'svelte/store';

export function getter<T>(key: string, reviver?: (key: string, value: unknown) => any): T | null {
  const strout = window.localStorage.getItem(key) || "null";
  return JSON.parse(strout, reviver) as T;
}

export function getAll<T>(keyFilter: (key: string) => boolean, reviver?: (key: string, value: unknown) => any) : T[] {
  if (typeof window === 'undefined') return [];
  const count = window.localStorage.length;
  const keys: string[] = [];
  for (let index = 0; index < count; index++) {
    const key = window.localStorage.key(index);
    if (key && keyFilter(key)) {
      keys.push(key);
    }
  }
  return keys.map(k => getter<T>(k, reviver)).filter(defined);
}

export function setter<T>(key: string, value: T | null, replacer?: (key: string, value: unknown) => any) {
  if (value === undefined) {
    value = null;
  }
  const str = JSON.stringify(value, replacer);
  window.localStorage.setItem(key, str);
  return str;
}

export function factory<T>(key: string, defaultValue: T) {
  const startingValue = getter<T>(key) || defaultValue;
  const wstore = writable<T>(startingValue);
  wstore.subscribe(value => {
    setter(key, value);
  });
  return wstore;
}

export interface LazyWritable<T> extends Writable<T> {
  load: () => Promise<boolean>;
  init: boolean;
}

export interface FactoryOpts {
  reviver?: (key: string, value: unknown) => any,
  replacer?: (key: string, value: unknown) => any,
}

/**
 * Create a store that persists values to localStorage. It requires explicit loading to work with SSR.
 * @param key The localStorage key to use.
 * @param initialValue The initial value of the store.
 * @param opts An option reviver and replacer used in the JSON serialization process.
 * @returns A writable store that needes to be initialized.
 */
export function lazyFactory<T>(key: string, initialValue?: T, opts?: FactoryOpts): LazyWritable<T> {
  console.log('lazyFactory', key, initialValue);
  const internal = writable<T>(initialValue);
  let init = false;

  async function load() {
    const value = getter<T>(key, opts?.reviver);
    console.log('lazyFactory::load', key, value);
    init = true;
    if (value != null) {
      internal.set(value);
      return true;
    } else if (initialValue !== undefined) {
      console.log('lazyFactory::load running setter', key, initialValue);
      setter(key, initialValue, opts?.replacer);
    }
    return false;
  }

  async function set(value: T) {
    if (!init) return;
    console.log('lazyFactory::set', key, value);
    setter(key, value, opts?.replacer);
    internal.set(value);
  }
  async function update(updater: Updater<T>) {
    if (!init) return;
    internal.update((value: T) => {
      const result = updater(value);
      setter(key, result, opts?.replacer);
      return result;
    });
  }
  
  return {
    ...internal,
    set,
    update,
    load,
    get init() {
      return init;
    },
  }
}

/**
 * Delete a key from localStorage
 * @param key The key to delete from localStorage
 */
export function clear(key: string) {
  window.localStorage.removeItem(key);
}