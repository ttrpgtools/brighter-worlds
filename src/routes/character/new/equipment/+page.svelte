<script lang="ts">
  import RollableTable from "$lib/RollableTable.svelte";
  import type { TableRoll } from "$lib/types";
  const opts = ['Sword', 'Axe', 'Spear', 'Glaive', 'Dagger', 'Whip'];
  const adjs = ['Scratched', 'Fun', 'Flimsy', 'Rusty', 'Shiny', 'Vicious'];
  function show(ev: CustomEvent<TableRoll<string>>) {
    alert(ev.detail.value);
  }
</script>

<div class="flex justify-center gap-4 mb-6">
  <div class="w-96">
    <RollableTable options={adjs} title="Adjectives" on:roll={show} />
  </div>
  <div class="w-96">
    <RollableTable options={opts} title="Weapons" on:roll={show} />
  </div>
</div>
