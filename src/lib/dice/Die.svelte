<script lang="ts">
import type { DieValue } from "$lib/types";
import D4 from "./D4.svelte";
import D6 from "./D6.svelte";
import D8 from "./D8.svelte";
import D10 from "./D10.svelte";
import D12 from "./D12.svelte";

export let which: DieValue;
export let size = 'h-6 w-6';
type AllDice = typeof D4 | typeof D6 | typeof D8 | typeof D10 | typeof D12;
const dMap = new Map<DieValue, AllDice>();
dMap.set(4, D4);
dMap.set(6, D6);
dMap.set(8, D8);
dMap.set(10, D10);
dMap.set(12, D12);
</script>
{#if dMap.has(which)}
<svelte:component this={dMap.get(which)} {size}/>
{/if}