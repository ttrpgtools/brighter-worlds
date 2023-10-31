<script lang="ts">
  import { createDialog } from 'svelte-headlessui';
  import { blur, scale } from 'svelte/transition';
  import { portal } from './util/portal';

  export let maxWidth = 'max-w-md';
  export let title = '';
  export let scrollable = true;
  type T = $$Generic;

  const dialog = createDialog({ label: title });
  let resolve: ((value?: any) => void) | undefined;

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
      dialog.open();
    });
  }

  export function close(value?: T) {
    if (resolve != null) {
      resolve(value);
      resolve = undefined;
    }
    dialog.close();
    unlock();
  }

  dialog.subscribe(({expanded}) => {
    if (!expanded) {
      if (resolve != null) {
        resolve();
        unlock();
        resolve = undefined;
      }
    }
  });
</script>

<div class="relative z-10 contents" use:portal hidden>
  {#if $dialog.expanded}
    
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div role="none" class="fixed inset-0 bg-purple-500 bg-opacity-20" on:click={() => close()} transition:blur />

    <div class="fixed inset-0">
      <div class="flex min-h-full items-center justify-center p-4 text-center">
        <div class="w-full {maxWidth} max-h-[calc(100vh-2rem)] transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all flex flex-col" use:dialog.modal transition:scale={{start: 0.5}}>
          <div class="{scrollable ? 'overflow-y-auto' : ''} h-full -mx-6 px-6 pb-6">
            <slot name="pretitle"></slot>
            {#if !!title}<h3 class="text-lg font-medium leading-6 text-center">{title}</h3>{/if}
            <slot {close} {open}></slot>
          </div>
          <div>
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
