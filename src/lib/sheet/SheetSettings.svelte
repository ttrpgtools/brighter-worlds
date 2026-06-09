<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import Toggle from '$lib/ui/toggle.svelte';
  import type { SheetSettings } from '$lib/types';
  const DISCORD_API_BASE = 'https://discord.com/api/webhooks/';

  let dialog: InputDialog<SheetSettings> | undefined = $state();
  interface Props {
    settings?: SheetSettings;
    title?: string;
  }
  const DEF = { rollToBridge: true, rollToDiscord: false, discordWebhook: '' };
  let { settings = $bindable(), title = 'Sheet Settings' }: Props = $props();
  let showDelete = false;
  let form = $state({
    ...(settings ?? DEF),
  });
  let valid = $derived(!form.rollToDiscord || form.discordWebhook?.startsWith(DISCORD_API_BASE));

  async function formResults() {
    const item = await dialog?.open();
    return item;
  }

  export async function open() {
    form = { ...(settings ?? DEF) };
    const item = await formResults();
    if (item != null) {
      settings = item;
    }
  }
</script>

<InputDialog {title} {showDelete} dice={[]} bind:this={dialog} {form} {valid}>
  <form class="text-center flex flex-col gap-3">
    <div class="flex gap-3 items-center">
      <Toggle bind:value={form.rollToBridge} /><span>Broadcast to Narrator</span>
    </div>
    <div class="flex gap-3 items-center">
      <Toggle bind:value={form.rollToDiscord} /><span>Send rolls to Discord</span>
    </div>
    <input
      type="text"
      name="discordWebhook"
      disabled={!form.rollToDiscord}
      placeholder="Discord Webhook"
      bind:value={form.discordWebhook}
      class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 grow disabled:bg-gray-200! dark:disabled:bg-gray-800! disabled:cursor-not-allowed"
    />
  </form>
</InputDialog>
