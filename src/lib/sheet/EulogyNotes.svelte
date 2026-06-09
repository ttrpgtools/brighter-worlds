<script lang="ts">
  import * as Tabs from '$lib/ui/tabs';
  import AutoTextarea from '$lib/AutoTextarea.svelte';
  import type { EulogyStanza } from '$lib/types';
  import { xp } from '$lib/util/character';
  import { onEnter } from '$lib/util/handlers';
  import EulogyDialog from './EulogyDialog.svelte';
  import Card from '$lib/ui/card.svelte';
  import Button from '$lib/ui/button.svelte';
  interface Props {
    eulogy: EulogyStanza[];
    notes?: string;
  }

  let { eulogy = $bindable(), notes = $bindable('') }: Props = $props();

  let availableXp = $derived(xp(eulogy));

  let dialog: EulogyDialog | undefined = $state();
</script>

<EulogyDialog bind:eulogy bind:this={dialog} />
<Tabs.Root value="epitaph" class="md:h-100 lg:order-2">
  <Card class="md:h-full" headerPadding={false}>
    {#snippet header()}
      <Tabs.List class="flex items-center w-full">
        <Tabs.Trigger value="epitaph" class="text-xl font-subtitle leading-6">Epitaph</Tabs.Trigger>
        <Tabs.Trigger value="notes" class="text-xl font-subtitle leading-6">Notes</Tabs.Trigger>
        <div class="py-4 flex gap-2 items-center ml-auto">
          <span class="text-lg font-subtitle inline-block h-6">XP:</span><span class=""
            >{availableXp}</span
          >
        </div>
      </Tabs.List>
    {/snippet}
    <Tabs.Content value="epitaph">
      {#each eulogy as stanza (stanza.id)}
        <div class="mb-4 pl-7 relative">
          <span class="font-symbol text-2xl text-purple-500 inline-block w-4 absolute left-0 -top-1"
            >{#if stanza.xp && stanza.spent}f{:else if !stanza.xp}Y{:else}p{/if}</span
          >
          <button
            type="button"
            class="cursor-pointer select-text"
            onclick={() => dialog?.editStanza(stanza.id)}
            onkeydown={onEnter(() => dialog?.editStanza(stanza.id))}>{stanza.message}</button
          >
        </div>
      {:else}
        <div class="mb-4">
          <p class="italic text-gray-600 dark:text-gray-400">Nothing noteworthy...</p>
        </div>
      {/each}
      <Button
        class="border-0"
        icon="plus"
        size="tight"
        iconClass="size-4"
        onclick={() => dialog?.addStanza()}
      />
    </Tabs.Content>
    <Tabs.Content value="notes" class="h-full">
      <AutoTextarea bind:value={notes} maxRows={12} minRows={5}></AutoTextarea>
    </Tabs.Content>
  </Card>
</Tabs.Root>
