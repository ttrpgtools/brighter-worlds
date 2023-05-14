<script lang="ts">
  import DieSelector from "$lib/sheet/DieSelector.svelte";
  import type { Attrs, DieValue } from "$lib/types";
  import { STEP, getWizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";

  const [wizard] = getWizard();

  if ($wizard !== STEP.ATTRIBUTES && browser) {
    goto(`/character/new`);
  }

  function forward() {
    wizard.setAttrs(attrs);
  }

  const dice: DieValue[] = [4, 6, 8];
  const attrs: Attrs = { str: 4, dex: 4, wil: 4 };
</script>

<h3 class="max-w-prose text-center mb-4 text-2xl font-subtitle">Choose your starting attributes</h3>
<p class="max-w-prose text-left mb-6">Attributes represent both a character’s prowess and current status. Assign one each of d4, d6, and d8 to your Attributes (STR, DEX, and WIL).</p>
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
