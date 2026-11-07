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
  <div class="flex items-start justify-between gap-2">
    <h4 class="min-w-0 flex-1 wrap-break-word py-1 font-medium leading-6">{name || '(unnamed)'}</h4>
    <div class="flex shrink-0 items-center gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        icon="pen"
        iconClass="size-5"
        title={`Edit ${kind} ${name}`}
        aria-label={`Edit ${kind} ${name}`}
        onclick={onedit}
      />
      {#if onadd}
        <Button
          size="icon-sm"
          variant="ghost"
          icon="addtomat"
          iconClass="size-5"
          disabled={addDisabled}
          title={`Add ${kind} ${name} to Mat`}
          aria-label={`Add ${kind} ${name} to Mat`}
          onclick={onadd}
        />
      {/if}
      {@render actions?.()}
      <DeleteButton
        compact
        size="size-5"
        label={`Delete ${kind} template ${name}`}
        confirmText={`Click again to delete ${kind}.`}
        onconfirm={deleteTemplate}
      />
    </div>
  </div>
  {@render children?.()}
</div>
