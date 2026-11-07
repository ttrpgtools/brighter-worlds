<script lang="ts">
  import CharacterRoute from '$lib/sheet/CharacterRoute.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

{#key `${data.owner ?? 'local'}:${data.id}`}
  <CharacterRoute {data} />
{/key}
