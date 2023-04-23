<script lang="ts" context="module">
import type { DieValue } from "$lib/types";
import D4, { value as d4 } from "./D4.svelte";
import D6, { value as d6 } from "./D6.svelte";
import D8, { value as d8 } from "./D8.svelte";
import D10, { value as d10 } from "./D10.svelte";
import D12, { value as d12 } from "./D12.svelte";
type AllDice = typeof D4 | typeof D6 | typeof D8 | typeof D10 | typeof D12;
const dMap = new Map<DieValue, AllDice>();
dMap.set(d4, D4);
dMap.set(d6, D6);
dMap.set(d8, D8);
dMap.set(d10, D10);
dMap.set(d12, D12);

export function knownDie(sides: number): sides is DieValue {
  return dMap.has(sides as DieValue);
}
</script>
<script lang="ts">
export let which: DieValue | DieValue[];
export let size = 'h-6 w-6';
$: first = Array.isArray(which) ? which[0] : which;
</script>
{#if dMap.has(first)}
<svelte:component this={dMap.get(first)} {size}/>
{/if}