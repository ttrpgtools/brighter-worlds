<script lang="ts">
  import Card from "$lib/Card.svelte";
  import type { Ability, Entity } from "$lib/types";

  export let calling: Entity;
  export let abilities: Ability[]

</script>
<Card>
  <div class="flex items-center gap-2" slot="header">
    <h3 class="text-xl font-subtitle leading-6 flex-1">{calling.name}</h3>
    <p class="text-gray-500 relative -top-1">(Calling)</p>
  </div>
  {#if calling.desc}
  <div>
    {calling.desc}
  </div>
  {/if}
  <ul>
    {#each abilities as ability}
    <li><span><strong>{ability.name}</strong> {ability.desc}</span><div>{@html ability.details ?? ''}</div></li>
    {/each}
  </ul>
</Card>