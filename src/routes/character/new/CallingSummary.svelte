<script lang="ts">
  import Button from "$lib/Button.svelte";
  import Card from "$lib/Card.svelte";
  import type { Calling } from "$lib/types";
  import CallingDetailDialog from "$lib/sheet/CallingDetailDialog.svelte";
  export let calling: Calling;
  let dialog: CallingDetailDialog;
</script>
<CallingDetailDialog {calling} bind:this={dialog} />
<Card>
  <h3 class="text-3xl font-subtitle text-purple-500">{calling.name}</h3>
  <p class="mb-4">{calling.tagline}</p>
  <p class="mb-4 italic">{calling.for}</p>
  <div class="flex items-end justify-between flex-1">
    <Button on:click>Choose</Button>
    <Button on:click={() => dialog.open()}>Details</Button>
  </div>
</Card>