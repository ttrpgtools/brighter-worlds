<script lang="ts">
  import { createDialog } from 'svelte-headlessui';
  import { blur, scale } from 'svelte/transition';

  export let title = '';

  const dialog = createDialog({ label: title });
  let resolve: ((value?: any) => void) | undefined;

  export async function open<T = unknown>() {
    return new Promise<T | undefined>((res) => {
      resolve = res;
      dialog.open();
    });
  }

  export function close(value?: unknown) {
    console.log('Try to close');
    if (resolve != null) {
      console.log('I am closing with', value);
      resolve(value);
      resolve = undefined;
    }
    dialog.close();
  }

  dialog.subscribe(({expanded}) => {
    if (!expanded) {
      if (resolve != null) {
        console.log('I am cleaning up.');
        resolve();
        resolve = undefined;
      }
    }
  });
</script>

<div class="relative z-10">
  {#if $dialog.expanded}
    
    <div class="fixed inset-0 bg-purple-500 bg-opacity-20" on:click={close} transition:blur />

    <div class="fixed inset-0 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4 text-center">
        <div class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all" use:dialog.modal transition:scale={{start: 0.5}}>
          <slot name="pretitle"></slot>
          {#if !!title}<h3 class="text-lg font-medium leading-6 text-center" id="modal-title">{title}</h3>{/if}
          <slot {close} {open}></slot>
        </div>
      </div>
    </div>
  {/if}
</div>
