<script lang="ts">
  import DieSelector from "$lib/sheet/DieSelector.svelte";
  import type { Attrs, DieValue } from "$lib/types";
  import { STEP, wizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";

  if ($wizard !== STEP.ATTRIBUTES && browser) {
    goto(`/character/new`);
  }

  function forward() {
    wizard.setAttrs(attrs);
    //goto(`/character/new/abilities`);
  }

  const dice: DieValue[] = [4, 6, 8];
  const attrs: Attrs = { str: 4, dex: 4, wil: 4 };
</script>

<div class="flex justify-center gap-4 mb-6">
  <div class="flex flex-col gap-2 items-center">
    <span class="font-bold text-xl">STR</span>
    <DieSelector {dice} bind:current={attrs.str} />
  </div>
  <div class="flex flex-col gap-2 items-center">
    <span class="font-bold text-xl">DEX</span>
    <DieSelector {dice} bind:current={attrs.dex} />
  </div>
  <div class="flex flex-col gap-2 items-center">
    <span class="font-bold text-xl">WIL</span>
    <DieSelector {dice} bind:current={attrs.wil} />
  </div>
</div>
<Button on:click={forward}>Next</Button>
