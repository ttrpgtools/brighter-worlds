<script lang="ts">
import type { NpcStats } from "$lib/types";
export let stats: NpcStats
</script>
<div class="">
  <h3 class="text-2xl font-bold">{stats.name}</h3>
  <p>{stats.grit} Grit, {#if stats.armor}{stats.armor} Armor, {/if}{stats.str} STR, {stats.dex} DEX, {stats.wil} WIL</p>

  {#if stats.notes.length > 0}
  <ul>
    {#each stats.notes as note}
      <li>{note}</li>
    {/each}
  </ul>
  {/if}
  {#if stats.wants}
    <p><strong>Wants:</strong> {stats.wants}</p>
  {/if}
  {#if stats.found}
    <p><strong>Often Found:</strong> {stats.found}</p>
  {/if}
</div>