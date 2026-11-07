<script lang="ts">
  import { Popover } from 'bits-ui';
  import ConfirmButtonLogic from './ConfirmButtonLogic.svelte';
  interface Props {
    confirmText: string;
    label?: string;
    compact?: boolean;
    onconfirm: () => void;
    children?: import('svelte').Snippet;
  }

  let { confirmText, label, compact = false, children: subChild, onconfirm }: Props = $props();
  let button: HTMLButtonElement | null = $state(null);
  const hintId = $props.id();
</script>

<ConfirmButtonLogic {onconfirm}>
  {#snippet children({ handleClick, handleIn, handleOut, ready, confirming, cancel })}
    <Popover.Root
      open={ready}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
    >
      <button
        bind:this={button}
        type="button"
        aria-label={label}
        title={label}
        aria-describedby={ready ? hintId : undefined}
        onmouseleave={handleOut}
        onmouseenter={handleIn}
        onblur={cancel}
        onkeydown={(event) => {
          if (confirming && event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancel();
          }
        }}
        onclick={handleClick}
        class={[
          'inline-flex shrink-0 items-center rounded-full border border-transparent bg-rose-300 dark:bg-rose-700 font-medium shadow-sm hover:bg-rose-200 dark:hover:bg-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
          compact ? 'size-8 justify-center p-1' : 'px-2.5 pt-2 pb-2.5',
          confirming &&
            'text-white bg-rose-500 dark:bg-rose-500 hover:bg-rose-500 dark:hover:bg-rose-500 active:bg-rose-500',
        ]}
      >
        {#if subChild}{@render subChild()}{:else}Confirm{/if}
      </button>
      <Popover.Portal>
        <Popover.Content
          id={hintId}
          role="tooltip"
          customAnchor={button}
          side="left"
          sideOffset={10}
          collisionPadding={8}
          trapFocus={false}
          preventScroll={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeydown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            cancel();
          }}
          class="z-[1000] w-max max-w-[min(18rem,calc(100vw-1rem))] rounded-md bg-rose-500 px-3 py-2 text-center text-sm text-white shadow-lg"
        >
          {confirmText}
          <Popover.Arrow class="text-rose-500" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  {/snippet}
</ConfirmButtonLogic>
