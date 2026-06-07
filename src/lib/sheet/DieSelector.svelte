<script lang="ts">
  import * as Select from '$lib/ui/select';
  import { Die, knownDie } from '$lib/dice';
  import type { DieValue } from '$lib/types';
  import Icon from '$lib/ui/icon.svelte';
  import { scale } from 'svelte/transition';
  interface Props {
    current: DieValue | 0;
    nullable?: boolean;
    invalid?: boolean;
    dice?: DieValue[];
    onchange?: () => void;
  }

  let {
    current = $bindable(),
    nullable = false,
    invalid = false,
    dice = [4, 6, 8, 10, 12],
    onchange,
  }: Props = $props();

  function stringToDie(v: string) {
    const num = parseInt(v, 10);
    if (knownDie(num)) {
      return num;
    }
    return 0;
  }
</script>

<div>
  <Select.Root
    type="single"
    bind:value={
      () => current.toString(),
      (v) => {
        current = stringToDie(v);
        onchange?.();
      }
    }
  >
    <Select.Trigger class={[invalid && 'border-red-500 dark:border-red-500 text-red-500']}>
      {#if current === 0}
        <Icon icon="xmark" class="size-6" />
      {:else}<Die which={current} />{/if}
    </Select.Trigger>

    <!--
          <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
            Heroicon name: mini/chevron-up-down 
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
            </svg>
          </span>
    
          Select popover, show/hide based on select state.
    
          Entering: ""
            From: ""
            To: ""
          Leaving: "transition ease-in duration-100"
            From: "opacity-100"
            To: "opacity-0"
    
          class={({ active }) =>
                  `relative cursor-default select-none py-2 px-3 ${active ? 'text-white bg-purple-500' : ''}`}
        -->

    <Select.Content
      class="max-h-64 min-w-16 overflow-auto rounded-md bg-white dark:bg-gray-900 py-1 text-base shadow-lg dark:shadow-purple-400/20 ring-1 ring-black/5 dark:ring-gray-300/5 focus:outline-none sm:text-sm"
    >
      {#if nullable}
        <Select.Item value="0">
          <div class="flex items-center gap-2">
            <Icon icon="xmark" class="size-6" />
            <div>0</div>
          </div>
        </Select.Item>
      {/if}
      {#each dice as die}
        <Select.Item value={die.toString()}>
          <div class="flex items-center gap-2">
            <div class="h-6 w-6"><Die which={die} /></div>
            <div>d{die}</div>
          </div>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
