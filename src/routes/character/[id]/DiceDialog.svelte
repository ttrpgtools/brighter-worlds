<script lang="ts">
  import NotificationDialog from "$lib/NotificationDialog.svelte";
  import type { DieValue } from "$lib/types";
  let dialog: NotificationDialog;

  let title = '';
  let dice: DieValue[] = [];

  export async function show(label: string, rolls: DieValue[] = []) {
    title = label;
    dice = rolls;
    return dialog.open();
  }
</script>
<NotificationDialog {title} {dice} bind:this={dialog}/>