<script lang="ts">
  import Card from "$lib/Card.svelte";
  import type { Calling } from "$lib/types";
  export let calling: Calling;

</script>
<Card>
  <h3 class="text-3xl font-subtitle text-purple-500">{calling.name}</h3>
  <p class="mb-4">{calling.tagline}</p>
  <p>{calling.for}</p>
</Card>