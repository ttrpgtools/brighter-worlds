import D4 from "./D4.svelte";
import D6 from "./D6.svelte";
import D8 from "./D8.svelte";
import D10 from "./D10.svelte";
import D12 from "./D12.svelte";
import Die from "./Die.svelte";
import type { DieValue } from "$lib/types";

export { D4, D6, D8, D10, D12, Die };

export function stepDown(die: DieValue) {
  if (die === 4) return 0;
  return (die - 2) as DieValue;
}

export function stepUp(die: DieValue) {
  if (die === 12) return 12;
  return (die + 2) as DieValue;
}
