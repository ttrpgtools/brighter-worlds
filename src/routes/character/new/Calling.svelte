<script lang="ts">
  import Button from "$lib/Button.svelte";
  import Card from "$lib/Card.svelte";
  import type { Calling } from "$lib/types";
  export let calling: Calling;

</script>
<Card>
  <h3 class="text-3xl font-subtitle text-purple-500">{calling.name}</h3>
  <p class="mb-4">{calling.tagline}</p>
  <p class="mb-4">{calling.for}</p>
  <Button on:click>Choose</Button>
</Card>