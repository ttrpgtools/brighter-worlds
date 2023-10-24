<script lang="ts">
  import { loadSheet } from "$lib/data/sheet-manager";
  import { isEmpty, type Item } from "$lib/types";
  import { append, update } from "$lib/util/array";

  export let id: string;
  export let item: Item;
  
  const chosen = loadSheet(id);
  let ok = false;
  $: {
    console.log($chosen);
    if (!isEmpty($chosen) && $chosen.equipment && !ok) {
      console.log('Checking existing equipment', $chosen.equipment.length, 'items');
      const exist = $chosen.equipment.find(x => x.name === item.name);
      if (exist) {
        console.log(`${item.name} already existed, adding ${item.quantity ?? 1}`);
        exist.quantity = (exist.quantity ?? 1) + (item.quantity ?? 1);
        $chosen.equipment = update($chosen.equipment, exist);
      } else {
        console.log(`Appending ${item.name}`);
        $chosen.equipment = append($chosen.equipment, item);
      }
      console.log($chosen.equipment);
      $chosen = $chosen;
      ok = true;
    }
  }
</script>
{#if ok}
<div>Added. You can close this window/tab.</div>
{/if}