<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { onDestroy } from 'svelte';

  interface Props {
    maxWidth?: string;
    title?: string;
    titleClass?: string;
    scrollable?: boolean;
    preventDismiss?: boolean;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    pretitle?: import('svelte').Snippet;
    children?: import('svelte').Snippet<[any]>;
    footer?: import('svelte').Snippet;
  }

  let {
    maxWidth = 'max-w-md',
    title = '',
    titleClass = 'text-lg font-medium leading-6 text-center',
    scrollable = true,
    preventDismiss = false,
    onOpenAutoFocus,
    onCloseAutoFocus,
    pretitle,
    children,
    footer,
  }: Props = $props();
  type T = $$Generic;

  let resolve: ((value?: any) => void) | undefined;
  let expanded = $state(false);
  let layer = $state(40);
  let returnFocus: HTMLElement | undefined;

  export async function open<T>() {
    const layers = Array.from(document.querySelectorAll('[data-dialog-layer]'), (element) =>
      Number(element.getAttribute('data-dialog-layer')),
    );
    layer = Math.max(38, ...layers) + 2;
    returnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    return new Promise<T | undefined>((res) => {
      resolve = res;
      expanded = true;
    });
  }

  function restoreFocus(event: Event) {
    onCloseAutoFocus?.(event);
    if (!event.defaultPrevented && returnFocus?.isConnected) {
      event.preventDefault();
      returnFocus.focus();
    }
  }

  export function close(value?: T) {
    if (resolve != null) {
      resolve(value);
      resolve = undefined;
    }
    expanded = false;
  }

  function handleOpenChange(open: boolean) {
    expanded = open;
    if (!open && resolve != null) {
      resolve();
      resolve = undefined;
    }
  }

  onDestroy(() => {
    resolve?.();
    resolve = undefined;
  });
</script>

<Dialog.Root open={expanded} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay>
      {#snippet child({ props })}
        <div
          {...props}
          data-dialog-layer={layer}
          style:z-index={layer}
          class="dialog-overlay fixed inset-0 bg-purple-950/35 dark:bg-black/60"
        ></div>
      {/snippet}
    </Dialog.Overlay>

    <Dialog.Content
      {onOpenAutoFocus}
      onCloseAutoFocus={restoreFocus}
      escapeKeydownBehavior={preventDismiss ? 'ignore' : 'close'}
      interactOutsideBehavior={preventDismiss ? 'ignore' : 'close'}
    >
      {#snippet child({ props })}
        <div
          style:z-index={layer + 1}
          class="fixed inset-0 flex min-h-full items-center justify-center p-4 text-center"
        >
          <div
            {...props}
            class="dialog-content w-full {maxWidth} max-h-[calc(100dvh-2rem)] transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle ring-1 ring-black/10 dark:ring-white/15 flex flex-col"
          >
            <div class="{scrollable ? 'overflow-y-auto' : ''} min-h-0 -mx-6 px-6 pb-6">
              {@render pretitle?.()}
              {#if !!title}<Dialog.Title class={titleClass}>
                  {title}
                </Dialog.Title>{/if}
              {@render children?.({ close, open })}
            </div>
            <div>
              {@render footer?.()}
            </div>
          </div>
        </div>
      {/snippet}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  .dialog-overlay {
    opacity: 1;
    transition: opacity 175ms ease;
  }

  .dialog-overlay[data-starting-style],
  .dialog-overlay[data-ending-style] {
    opacity: 0;
  }

  .dialog-content {
    opacity: 1;
    transform: scale(1);
    box-shadow:
      0 24px 80px -12px rgb(0 0 0 / 0.75),
      0 8px 28px rgb(0 0 0 / 0.45);
    transition:
      opacity 175ms ease,
      transform 175ms ease;
  }

  .dialog-content[data-starting-style],
  .dialog-content[data-ending-style] {
    opacity: 0;
    transform: scale(0.5);
  }
</style>
