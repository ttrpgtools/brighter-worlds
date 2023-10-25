import { getContext, hasContext, setContext } from "svelte";

const gmContextKey = 'bw-is-gm-context';

type GmContext = { gm: boolean };

export function setGmContext() {
  setContext<GmContext>(gmContextKey, { gm: true });
}

export function isGmContext() {
  return hasContext(gmContextKey) ? (getContext<GmContext>(gmContextKey).gm ?? false) : false;
}