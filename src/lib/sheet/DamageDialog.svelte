<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import Toggle from "$lib/Toggle.svelte";
  import type { DamageDetails, DamageForm } from "$lib/types";
  import { calculateDamage } from "./damage";

  let damageDialog: InputDialog<DamageForm>;
  const damageForm: DamageForm = { damage: '', bypassGrit: false, bypassArmor: false, overflow: true };
  let saveType = '';

  export async function getDamage(detail: DamageDetails) {
    saveType = detail.type.toUpperCase();
    const howmuch = await damageDialog.open();
    const results = calculateDamage(detail, howmuch);
    return results;
  }

</script>
<InputDialog title="How much potential {saveType} damage?" dice={[]} bind:this={damageDialog} form={damageForm}>
  <form class="text-center flex flex-col gap-3">
    <input type="text" inputmode="tel" name="damage" bind:value={damageForm.damage} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
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