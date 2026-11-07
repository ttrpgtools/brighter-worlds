<script lang="ts">
  import AccountPanel from '$lib/AccountPanel.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Account access · Brighter Worlds</title></svelte:head>
<AccountPanel account={data} />
