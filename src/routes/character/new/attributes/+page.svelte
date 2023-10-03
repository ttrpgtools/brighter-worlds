<script lang="ts">
  import DieSelector from "$lib/sheet/DieSelector.svelte";
  import type { Attrs, DieValue } from "$lib/types";
  import { STEP, getWizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import Die from "$lib/dice/Die.svelte";
  import { calculateGrit } from "$lib/util/grit";
  
  const [wizard] = getWizard();

  if ($wizard !== STEP.ATTRIBUTES && browser) {
    goto(`/character/new`);
  }

  function forward() {
    wizard.setAttrs(attrs);
  }

  const attrs: Attrs = { str: 4, dex: 4, wil: 4 };
  $: strdice = [4].concat([6, 8].filter(d => d !== attrs.dex && d !== attrs.wil)) as DieValue[];
  $: dexdice = [4].concat([6, 8].filter(d => d !== attrs.str && d !== attrs.wil)) as DieValue[];
  $: wildice = [4].concat([6, 8].filter(d => d !== attrs.dex && d !== attrs.str)) as DieValue[];

  $: grit = calculateGrit(attrs.dex, attrs.wil);
</script>

<h3 class="max-w-prose text-center mb-4 text-2xl font-subtitle">Choose your starting attributes</h3>
<div class="max-w-prose prose dark:prose-invert prose-lg text-left mb-6">
  <p>Attributes represent both a character's prowess and current status. All three of your Attributes start at a <Die which={4} /> d4. Step up one Attribute twice (to a <Die which={8}/> d8), and another Attribute once (to a <Die which={6}/> d6).</p>

  <ul>
    <li>Strength (<strong>STR</strong>): Represents physical power, toughness, and endurance.</li>
    <li>Dexterity (<strong>DEX</strong>): Represents speed, reflexes, and precision.</li>
    <li>Willpower (<strong>WIL</strong>): Represents focus, alacrity, and concentration.</li>
  </ul>
</div>
<div class="flex justify-center gap-4 mb-6">
  <div class="flex flex-col gap-2 items-center">
    <span class="font-bold text-xl">STR</span>
    <DieSelector dice={strdice} bind:current={attrs.str} />
  </div>
  <div class="flex flex-col gap-2 items-center">
    <span class="font-bold text-xl">DEX</span>
    <DieSelector dice={dexdice} bind:current={attrs.dex} />
  </div>
  <div class="flex flex-col gap-2 items-center">
    <span class="font-bold text-xl">WIL</span>
    <DieSelector dice={wildice} bind:current={attrs.wil} />
  </div>
</div>
<div class="max-w-prose prose dark:prose-invert prose-lg text-left mb-6">
  <p>
    Grit is a character's mental concentration and ability to avoid being harmed. It represents a combination of reflexes and situational awareness.
  </p>
  <p>
    Grit is lost when being attacked, performing complex tasks like casting Spells, or attempting to carry too much. It is not a measure of physical health, and lost Grit is restored quickly.
  </p>
  <p class="border rounded-sm border-purple-600 dark:border-purple-400 px-3 py-2">
    Your Maximum Grit starts at 1, plus 1 for each time you stepped up DEX and WIL.
  </p>
  <p class="text-xl">Your starting grit: <strong>{grit}</strong></p>
</div>
<Button on:click={forward}>Next</Button>
