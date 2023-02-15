<script lang="ts">
  import NotificationDialog from "$lib/NotificationDialog.svelte";
  import type { DieValue } from "$lib/types";
  let dialog: NotificationDialog;

  let title = '';
  let dice: DieValue[] = [];
  let msg = '';

  export async function show(label: string, rolls: DieValue[] = [], subtext = '') {
    title = label;
    dice = rolls;
    msg = subtext;
    return dialog.open();
  }
</script>
<NotificationDialog {title} {dice} {msg} bind:this={dialog}/>