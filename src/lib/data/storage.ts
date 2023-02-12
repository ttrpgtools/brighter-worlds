import { writable, type Writable } from 'svelte/store';

function getter<T>(key: string, reviver?: (key: string, value: unknown) => any): T | null {
  const strout = window.localStorage.getItem(key) || "null";
  return JSON.parse(strout, reviver) as T;
}

function setter<T>(key: string, value: T | null, replacer?: (key: string, value: unknown) => any) {
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
  load: () => void
  init: boolean
}

export interface FactoryOpts {
  reviver?: (key: string, value: unknown) => any,
  replacer?: (key: string, value: unknown) => any,
}

export function lazyFactory<T>(key: string, defaultValue: T, opts?: FactoryOpts) {
  const wstore = writable<T>(defaultValue) as LazyWritable<T>;
  let loading = false;
  wstore.init = false;
  wstore.load = () => {
    loading = true;
    const saved = getter<T>(key, opts?.reviver);
    if (saved != null) {
      wstore.set(saved);
    }
    loading = false;
    wstore.init = true;
  };
  wstore.subscribe(value => {
    if (!loading && wstore.init) {
      setter(key, value, opts?.replacer);
    }
  });
  return wstore;
}

export function get<T = unknown>(key: string) {
  return getter<T>(key);
}

export function set<T = unknown>(key: string, value: T) {
  return setter<T>(key, value);
}

export function clear(key: string) {
  window.localStorage.removeItem(key);
}