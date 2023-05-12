import { getContext, hasContext, setContext } from "svelte";
import { writable, type Writable } from "svelte/store";

const DTMODE = 'setting:desktopMode';

function getContextStore<T>(key: string, def?: T) {
  return function () {
    let store: Writable<T>;
    if (!hasContext(key)) {
      store = writable(def);
      setContext(key, store);
    } else {
      store = getContext(key);
    }
    return store;
  }
}

export const getDesktopMode = getContextStore(DTMODE, false);
