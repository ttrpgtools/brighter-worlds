<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Button from '$lib/ui/button.svelte';

  interface Props {
    name: string;
    kind: string;
    onedit: () => void;
    onadd?: () => void;
    ondelete: () => void;
    addDisabled?: boolean;
    actions?: Snippet;
    children?: Snippet;
  }

  let {
    name,
    kind,
    onedit,
    onadd,
    ondelete,
    addDisabled = false,
    actions,
    children,
  }: Props = $props();
  let entry: HTMLDivElement | undefined = $state();

  async function deleteTemplate() {
    const next = entry?.nextElementSibling?.querySelector<HTMLButtonElement>('button');
    const previous = entry?.previousElementSibling?.querySelector<HTMLButtonElement>('button');
    const sectionAction = entry
      ?.closest('details')
      ?.querySelector<HTMLButtonElement>('summary button');
    ondelete();
    await tick();
    (next ?? previous ?? sectionAction)?.focus();
  }
</script>

<div
  bind:this={entry}
  class="min-w-0 rounded-xl border border-purple-200 p-3 dark:border-purple-800"
>
  <h4 class="break-words font-medium">{name || '(unnamed)'}</h4>
  <div class="mt-2 flex flex-wrap gap-2">
    <Button size="sm" variant="outline" aria-label={`Edit ${kind} ${name}`} onclick={onedit}
      >Edit</Button
    >
    {#if onadd}
      <Button
        size="sm"
        disabled={addDisabled}
        aria-label={`Add ${kind} ${name} to Mat`}
        onclick={onadd}>Add to Mat</Button
      >
    {/if}
    {@render actions?.()}
    <DeleteButton
      label={`Delete ${kind} template ${name}`}
      confirmText="Click again to delete template."
      onconfirm={deleteTemplate}
    />
  </div>
  {@render children?.()}
</div>
