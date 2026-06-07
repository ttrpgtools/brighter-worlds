<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { blur, scale } from 'svelte/transition';

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

  function lock() {
    Object.assign(document.body.style, {
      'padding-right': `${window.innerWidth - document.documentElement.clientWidth}px`,
    });
    document.body.classList.add('overflow-hidden');
  }

  function unlock() {
    document.body.removeAttribute('style');
    document.body.classList.remove('overflow-hidden');
  }

  export async function open<T>() {
    return new Promise<T | undefined>((res) => {
      resolve = res;
      lock();
      expanded = true;
    });
  }

  export function close(value?: T) {
    if (resolve != null) {
      resolve(value);
      resolve = undefined;
    }
    expanded = false;
    unlock();
  }

  function handleOpenChange(open: boolean) {
    expanded = open;
    if (open) {
      lock();
    } else {
      if (resolve != null) {
        resolve();
        resolve = undefined;
      }
      unlock();
    }
  }
</script>

<Dialog.Root bind:open={expanded} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    {#if expanded}
      <Dialog.Overlay>
        {#snippet child({ props })}
          <div {...props} class="fixed inset-0 bg-purple-500/20" transition:blur></div>
        {/snippet}
      </Dialog.Overlay>

      <div class="fixed inset-0">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Content>
            {#snippet child({ props })}
              <div
                {...props}
                class="w-full {maxWidth} max-h-[calc(100vh-2rem)] transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all flex flex-col"
                transition:scale={{ start: 0.5 }}
              >
                <div class="{scrollable ? 'overflow-y-auto' : ''} h-full -mx-6 px-6 pb-6">
                  {@render pretitle?.()}
                  {#if !!title}<Dialog.Title class="text-lg font-medium leading-6 text-center"
                      >{title}</Dialog.Title
                    >{/if}
                  {@render children?.({ close, open })}
                </div>
                <div>
                  {@render footer?.()}
                </div>
              </div>
            {/snippet}
          </Dialog.Content>
        </div>
      </div>
    {/if}
  </Dialog.Portal>
</Dialog.Root>
