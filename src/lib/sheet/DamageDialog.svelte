<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import Toggle from "$lib/Toggle.svelte";
  import type { DamageDetails, DamageForm } from "$lib/types";
  import { calculateDamage } from "./damage";

  let damageDialog: InputDialog<DamageForm>;
  const damageForm: DamageForm = { damage: '', bypassGrit: false, bypassArmor: false, overflow: true, type: 'str' };
  let saveType = '';

  export async function getDamage(detail: DamageDetails) {
    saveType = (detail.type ?? '').toUpperCase();
    const howmuch = await damageDialog.open();
    const results = calculateDamage(detail, howmuch);
    return results;
  }

</script>
<InputDialog title="How much potential {saveType} damage?" dice={[]} bind:this={damageDialog} form={damageForm}>
  <form class="text-center flex flex-col gap-3">
    <input type="text" inputmode="tel" name="damage" bind:value={damageForm.damage} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    {#if !saveType}
    <div>
      <span class="isolate inline-flex rounded-md shadow-sm">
        <button type="button" aria-pressed={damageForm.type === 'str'} on:click={() => damageForm.type = 'str'} class="relative inline-flex items-center rounded-l-md bg-purple-300 dark:bg-purple-700 dark:aria-pressed:bg-purple-300 aria-pressed:bg-purple-700 aria-pressed:text-white dark:aria-pressed:text-gray-800 dark:ring-purple-300 ring-purple-700 px-3 py-2 text-sm font-semibold ring-1 ring-inset hover:bg-purple-200 dark:hover:bg-purple-800 focus:z-10 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-purple-500 focus:outline-none">STR</button>
        <button type="button" aria-pressed={damageForm.type === 'dex'} on:click={() => damageForm.type = 'dex'} class="relative -ml-px inline-flex items-center bg-purple-300 dark:bg-purple-700 dark:aria-pressed:bg-purple-300 aria-pressed:bg-purple-700 aria-pressed:text-white dark:aria-pressed:text-gray-800 dark:ring-purple-300 ring-purple-700 px-3 py-2 text-sm font-semibold ring-1 ring-inset hover:bg-purple-200 dark:hover:bg-purple-800 focus:z-10 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-purple-500 focus:outline-none">DEX</button>
        <button type="button" aria-pressed={damageForm.type === 'wil'} on:click={() => damageForm.type = 'wil'} class="relative -ml-px inline-flex items-center rounded-r-md bg-purple-300 dark:bg-purple-700 dark:aria-pressed:bg-purple-300 aria-pressed:bg-purple-700 aria-pressed:text-white dark:aria-pressed:text-gray-800 dark:ring-purple-300 ring-purple-700 px-3 py-2 text-sm font-semibold ring-1 ring-inset hover:bg-purple-200 dark:hover:bg-purple-800 focus:z-10 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-purple-500 focus:outline-none">WIL</button>
      </span>
    </div>
    {/if}
    <div class="flex gap-4 items-center flex-wrap">
      <div class="flex gap-2 items-center">
        <Toggle bind:value={damageForm.bypassGrit} /> Bypass Grit 
      </div>
      <div class="flex gap-2 items-center">
        <Toggle bind:value={damageForm.bypassArmor} /> Bypass Armor 
      </div>
      <div class="flex gap-2 items-center">
        <Toggle bind:value={damageForm.overflow} /> Overflow 
      </div>
    </div>
  </form>
</InputDialog>