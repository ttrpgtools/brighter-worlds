<script lang="ts">
import Card from "$lib/Card.svelte";
  import { Die } from "$lib/dice";
import type { NpcStats } from "$lib/types";
export let stats: NpcStats
$: hasAttacks = Array.isArray(stats.attacks) && stats.attacks.length > 0;
const last = (a: unknown[], i: number) => i === a.length - 1;
</script>
<Card>
  <div class="text-left ml-4 mt-4" slot="header">
    <h3 class="text-3xl font-bold font-subtitle text-purple-500">{stats.name}</h3>
    <p class="flex gap-1 items-center my-1">
      <span>{stats.grit} Grit,</span>
      {#if stats.armor}<span>{stats.armor} Armor,</span>{/if}
      <Die which={stats.str} size="w-4 h-4"/><span>d{stats.str} STR,</span>
      <Die which={stats.dex} size="w-4 h-4"/><span>d{stats.dex} DEX,</span>
      <Die which={stats.wil} size="w-4 h-4"/><span>d{stats.wil} WIL</span>
    </p>
    
    {#if hasAttacks}
      {#each stats.attacks as attack, a}
      <p class="flex flex-wrap my-1 items-center"><span class="mr-1">{attack.name}</span>{#if attack.damage} (<Die which={attack.damage} size="w-4 h-4"/><span class="ml-1">d{attack.damage}</span>){/if}{#if attack.desc}, <span>{attack.desc}</span>{/if}</p>
      {/each}
    {/if}
  </div>
  <div class="text-left">
    {#if stats.notes.length > 0}
    <ul class="mb-4">
      {#each stats.notes as note}
        <li class="pl-8 my-2 list-bw">{note}</li>
      {/each}
    </ul>
    {/if}
    {#if stats.wants}
      <p class="my-2"><strong>Wants:</strong> {stats.wants}</p>
    {/if}
    {#if stats.found}
      <p class="my-2"><strong>Often Found:</strong> {stats.found}</p>
    {/if}
  </div>
</Card>