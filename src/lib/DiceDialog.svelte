<script lang="ts">
  import NotificationDialog from "$lib/NotificationDialog.svelte";
  import type { DieValue } from "$lib/types";
  let dialog: NotificationDialog;

  let title = '';
  let dice: DieValue[] = [];
  let msg = '';
  let titleClass = '';

  export async function show(label: string, rolls: DieValue[] = [], subtext = '', titleClasses = '') {
    title = label;
    dice = rolls;
    msg = subtext;
    titleClass = titleClasses;
    return dialog.open();
  }
</script>
<NotificationDialog {title} {dice} {msg} {titleClass} bind:this={dialog}/>