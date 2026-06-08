<script lang="ts">
  import { Dialog } from 'bits-ui';

  interface Props {
    maxWidth?: string;
    title?: string;
    scrollable?: boolean;
    pretitle?: import('svelte').Snippet;
    children?: import('svelte').Snippet<[any]>;
    footer?: import('svelte').Snippet;
  }

  let {
    maxWidth = 'max-w-md',
    title = '',
    scrollable = true,
    pretitle,
    children,
    footer,
  }: Props = $props();
  type T = $$Generic;

  let resolve: ((value?: any) => void) | undefined;
  let expanded = $state(false);

  export async function open<T>() {
    return new Promise<T | undefined>((res) => {
      resolve = res;
      expanded = true;
    });
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
</script>

<Dialog.Root open={expanded} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay>
      {#snippet child({ props })}
        <div {...props} class="dialog-overlay fixed inset-0 z-40 bg-purple-500/20"></div>
      {/snippet}
    </Dialog.Overlay>

    <Dialog.Content>
      {#snippet child({ props })}
        <div class="fixed inset-0 z-50 flex min-h-full items-center justify-center p-4 text-center">
          <div
            {...props}
            class="dialog-content w-full {maxWidth} max-h-[calc(100vh-2rem)] transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl flex flex-col"
          >
            <div class="{scrollable ? 'overflow-y-auto' : ''} h-full -mx-6 px-6 pb-6">
              {@render pretitle?.()}
              {#if !!title}<Dialog.Title class="text-lg font-medium leading-6 text-center">
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
