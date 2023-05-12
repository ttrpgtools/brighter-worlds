<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import Toggle from "$lib/Toggle.svelte";
  import type { SheetSettings } from "$lib/types";
  const DISCORD_API_BASE = 'https://discord.com/api/webhooks/';

  export let settings: SheetSettings = { rollToBridge: false, rollToDiscord: false, discordWebhook: '' };

  let dialog: InputDialog<SheetSettings>;
  let title = 'Sheet Settings';
  let showDelete = false;
  let form = { ...settings };
  $: valid = !form.rollToDiscord || form.discordWebhook?.startsWith(DISCORD_API_BASE);

  async function formResults() {
    const item = await dialog.open();
    return item;
  }

  export async function open() {
    form = { ...settings };
    const item = await formResults();
    if (item != null) {
      settings = item;
    }
  }
</script>
<InputDialog {title} {showDelete} dice={[]} bind:this={dialog} form={form} {valid}>
  <form class="text-center flex flex-col gap-3">
    <div class="flex gap-3 items-center">
      <Toggle bind:value={form.desktopMode} /><span>Single click to roll (right-click for menu)</span> 
    </div>
    <div class="flex gap-3 items-center">
      <Toggle bind:value={form.rollToBridge} /><span>Broadcast rolls to listeners</span> 
    </div>
    <div class="flex gap-3 items-center">
      <Toggle bind:value={form.rollToDiscord} /><span>Send rolls to Discord</span> 
    </div>
    <input type="text" name="discordWebhook" disabled={!form.rollToDiscord} placeholder="Discord Webhook" bind:value={form.discordWebhook} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow disabled:!bg-gray-800 disabled:cursor-not-allowed">
  </form>
</InputDialog>