import type { DieValue } from "$lib/types";

export function calculateGrit(dex: DieValue, wil: DieValue) {
  return 1 + Math.floor((dex - 4) / 2) + Math.floor((wil - 4) / 2);
}
