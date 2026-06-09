<script lang="ts">
  import Button from '$lib/ui/button.svelte';
  import Card from '$lib/ui/card.svelte';
  import type { Calling } from '$lib/types';
  import CallingDetailDialog from '$lib/sheet/CallingDetailDialog.svelte';
  interface Props {
    calling: Calling;
    onclick: () => void;
  }

  let { calling, onclick }: Props = $props();
  let dialog: CallingDetailDialog | undefined = $state();
</script>

<CallingDetailDialog {calling} bind:this={dialog} />
<Card>
  <h3 class="text-3xl font-subtitle text-purple-500">{calling.name}</h3>
  <p class="mb-4">{calling.tagline}</p>
  <p class="mb-4 italic">{calling.for}</p>
  <div class="flex items-end justify-between flex-1">
    <Button {onclick}>Choose</Button>
    <Button onclick={() => dialog?.open()}>Details</Button>
  </div>
</Card>
